---
title: Automating the HVAC System
# date: 2025-07-16
# categories are Family, Photography, Places, Projects, Reviews, Software, Thoughts
category: Projects
tags:
- homeassistant
- automation
- smarthome
- climate
media_subpath: /assets/img/posts/automating-hvac-system/
image:
    path: preview.jpg
    lqip: preview.lqip.jpg
---

In the [last post]({% post_url 2025-07-16-hvac-helper-sensors %}), we created a bunch of sensors
and automations to make it possible to control the HVAC system. This time, we're going to build the
portions of the system which control the thermostat, raising and lowering the temperature as
desired.

This is the weirdest one and has a separate script to accompany the automation. To describe the goal,
we're trying to determine where the the warmest (when AC is running) room is and set the cooling
to run until _that_ room is at the target temperature. This has the unfortunate side effect of
cooling the rest of the rooms beyond the target, but I'm fine with that (since my office is the 
hottest room in the house so I get to benefit from it). However, because wee want to make sure that
we're getting to the actual desired temperature and because of the way thermostats work, we have to
tell it to cool _beyond_ the point where it thinks it needs to be.

The result is this... well _long script_. A lot of the length is simply documentation for the inputs
to the script, but there's more complex stuff in there too

```yaml
{% raw %}
script:
  update_thermostat_temp:
    alias: Climate - Update Thermostat Temperature
    mode: restart
    description: >-
      This script handles checking the current temperatures, the desired temperature,
      and the HVAC mode (all passed into this script) and then instructs the
      HVAC system to turn on/off accordingly by setting the target temperature
      of the thermostat in charge.

      This script expects to work with a single thermostat; if you have multiple
      thermostats, set up an automation for each.

      This script only anticipates working with an enabled HVAC system, meaning
      in "cool" or "heat" mode. Currently, it does not work with "heat_cool".
      If the HVAC system is in "off" mode, then do not call this script. It also
      does not pay any attention to away mode; that should be handled separately,
      perhaps as a condition in the automation.

    fields:
      buffer:
        name: Buffer
        description: >-
          A buffer applied to the temperature when reading which helps prevent
          rapid cycling
        example: "0.5"
        default: 0.5
        selector:
          number:
            min: 0
            max: 2
            step: 0.1
            mode: box

      overshoot:
        name: Overshoot
        description: >-
          This will be added/subtracted to the target temperature in order to
          ensure the thermostat stays engaged until next iteration of this script
        example: "2"
        default: 2
        selector:
          number:
            min: 0
            max: 3
            step: 0.1
            mode: box

      thermostat_temp_sensor:
        name: Thermostat Temperature Sensor
        description: >-
          The temperature the thermostat currently thinks it is. This can often
          be different than the temperature in multiple rooms, yet controls the
          real-world behavior of the system, so we need to include it
        example: "sensor.my_thermostat_temperature"
        required: true
        selector:
          entity:
            filter:
              - device_class: temperature
                domain: sensor

      thermostat:
        name: Thermostat
        description: The thermostat which should be controlled by this script
        example: "climate.my_thermostat"
        required: true
        selector:
          entity:
            filter:
              - domain: climate

      room_temp_sensors:
        name: Room Temperature Sensors
        description: >-
          A collection of room temperatures which should be considered when
          calculating whether to engage or disengage the HVAC system. These are
          likely to be temp sensors in the rooms you want covered.
        example: "['sensor.office_temperature', 'sensor.bedroom_temperature']"
        required: true
        selector:
          entity:
            filter:
              - device_class: temperature
                domain: sensor
            multiple: true

      room_target_temp_entities:
        name: Room Target Temperature Entities
        description: >-
          A collection of entities which contain the target temperatures for
          each of the rooms. This can be a single desired temp (e.g. "cool to 78")
          or it can be a list (e.g. "cool this room to 75, that room to 78")
        example: "['input_number.office_target_temperature', 'input_number.bedroom_target_temperature']"
        required: true
        selector:
          entity:
            filter:
              - domain: input_number
            multiple: true

      current_hvac_mode:
        name: Current HVAC Mode
        description: >-
          The mode which the HVAC system is currently in. Accepted values are
          "cool" and "heat".
        example: cool
        required: true
        selector:
          select:
            options:
              - cool
              - heat

    variables:
      buffer: "{{ buffer | default(0.5) | float }}"
      overshoot: "{{ overshoot | default(2) | float }}"

      # add the thermostat temp sensor to the list of room temp sensors
      all_temp_sensors: >
        {{ room_temp_sensors + [thermostat_temp_sensor] }}

      # Gather the temperatures for all the sensors
      all_current_temps: >
        {{ all_temp_sensors | map('states') | select('match', '^[0-9.]+$') |  map('int') | list }}

      # Gather all the target temperatures
      all_target_temps: >
        {{ room_target_temp_entities | map('states') | select('match', '^[0-9.]+$') |  map('int') | list }}

      # We'll also need the thermostat current temp for future use
      current_thermostat_temp: "{{ states(thermostat_temp_sensor) | int }}"

      # Determine the temp to use as the current temp; max temp if cooling, min temp
      # for heating. More description: if we're heating, we want to make the
      # coldest room the current temp so that can be heated to the desired temp.
      # For cooling, we want to cool the hottest room to the target temp
      current_aggregate_temp: >-
        {% if current_hvac_mode == "cool" %}
          {{ all_current_temps | max }}
        {% else %}
          {{ all_current_temps | min }}
        {% endif %}

      # Determine the temp to use as the target temp; min temp if cooling, max temp
      # for heating.
      current_target_temp: >-
        {% if current_hvac_mode == "cool" %}
          {{ all_target_temps | min }}
        {% else %}
          {{ all_target_temps | max }}
        {% endif %}

    sequence:
      - alias: Decide whether we should engage the HVAC and set the target temp
        if:
          - alias: Test to see if we're in cooling mode
            condition: template
            value_template: >-
              {{ current_hvac_mode == "cool" }}
        then:
          - alias: Set the variables for cooling
            variables:
              should_engage: >-
                {{ current_aggregate_temp > current_target_temp + buffer }}
              target_engaged_temp: >-
                {{ current_target_temp - overshoot }}
              target_disengaged_temp: >-
                {{ current_thermostat_temp + overshoot }}
        else:
          - alias: Set the variables for heating
            variables:
              should_engage: >-
                {{ current_aggregate_temp < current_target_temp - buffer }}
              target_engaged_temp: >-
                {{ current_target_temp + overshoot }}
              target_disengaged_temp: >-
                {{ current_thermostat_temp - overshoot }}

      - alias: Choose the target temp as appropriate based on mode and temp
        if:
          - alias: Test to see if we need to engage the thermostat
            condition: template
            value_template: >-
              {{ should_engage }}
        then:
          - alias: Use the engage values for the target
            variables:
              actual_target_temp: "{{ target_engaged_temp }}"
        else:
          - alias: Use the disengaged value for the target
            variables:
              actual_target_temp: "{{ target_disengaged_temp }}"

      - alias: Check to see if the HVAC system is disabled; don't continue if it's not
        condition: state
        entity_id: binary_sensor.disable_upstairs_climate_operation
        state: "off"

      - alias: Check to see if the thermostat is on; don't continue if it's not
        condition: template
        value_template: >-
          {{ is_state(thermostat, "heat") or is_state(thermostat, "cool") }}

      - alias: Update the thermostat's temperature
        action: climate.set_temperature
        target:
          entity_id: >-
            {{ thermostat }}
        data:
          temperature: "{{ actual_target_temp }}"
{% endraw %}
```