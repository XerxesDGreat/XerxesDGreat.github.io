---
title: Automating the HVAC System
date: 2025-07-23
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
    alt: Credit to Krzysztof Kotkowicz on Unsplash https://unsplash.com/@lancaster83
---

In the [last post]({% post_url 2025-07-16-hvac-helper-sensors %}), we created a bunch of sensors
and automations to make it possible to control the HVAC system. This time, we're going to build the
portions of the system which control the thermostat, raising and lowering the temperature as
desired.

Before we get started though, let's determine how we actually want this to function. In plain English,
what we want to do is:

> Periodicallly check the current actual temperature in all the rooms, compare that against the 
> desired temperature for all rooms, determine whether the actual temperature is within the range
> we want, and if not, update the thermostat's set temperature in order to reach the desired
> temperature.

With that in mind, as we do whenever faced wwith complex problem we'll break this up into a number
of smaller problems to solve. The first separation we'll do (and you'll see why later) is to separate
"what to do" from "when to do it" and focus first on what to do:

- Get all current temps
- Get all desired temps
- Determine whether current temp is correct
- If not, update thermostat

So let's get into it!

But first, a _huge_ caveat.

> The solution we're building here does _not_ attempt to make each room be a different
> temperature; that requires expensive hardware and another integration we'll deal with in a later
> post. Since _most_ HVAC installations won't be able to target different temperatures for different
> rooms, I'm presenting the most common one: whole house or one of a dual zone (e.g. upstairs and
> downstairs).
{: .prompt-warning }


## Building a script
### Why and initial steps

For the "what to do" portion, we're going to create a script, which is a set of conditions and
actions which are executed when the script is called. The reason we're going to use a script
instead of an automation is because then it can be used by many different automations if we choose
to do so. We also get some help through the use of variable the script expects to have; this will
ensure future changes are easier to make as we _know_ what information/sensors/inputs we'll need.

```yaml
{% raw %}
script:
  update_thermostat_temp:
    alias: Climate - Update Thermostat Temperature
    mode: restart # this means "if this is running and something else triggers it again, stop and restart the script"

    fields:
      # this is where we'll put the information we want to provide to the script

    variables:
      # this sets some internal variables for use later in the actions

    sequence:
      # the sequence of actions we will take
{% endraw %}
```

As before, we'll introduce the individual chunks of code as we talk about each piece, then bring it
all together at the end.

### Get all current temperatures

As mentioned in the last post, we set up a temperature sensor in each room we care about. When we're
determining the current temperature, we'll want to do a simple min/max operation. For example, if
we're in cooling mode (AC), the "current temperature" is the _hottest_ of all the rooms because we
want to get all rooms to the target temperature, and unless we cool the hottest room to that target,
we will not have succeeded. The reverse is true if we're in heating mode; we want to select the
_coolest_ of the rooms.

To make this happen, we'll need to make the script aware of the room temperature sensors as well as
what mode we're in. Let's first create a couple fields for this:

```yaml
{% raw %}
fields:
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
{% endraw %}
```

Since these are in the `fields` dictionary, we'll be expected to pass these into the script, which
itself is going to expect the values later on when defining variables or when performing actions.
These are full examples of the fields, including the `selector` details which are useful when
calling the script from the UI, whether directly or in an automation. We'll also want the sensor on
the thermostat itself so we can make sure that we're getting a full view of the temperature spread.

When the script is executing, we'll need to do the min/max operation as mentioned before; in our
case, we'll do that in the `variables` block so we can set it once and refer to it multiple times:

```yaml
{% raw %}
variables:
      # add the thermostat temp sensor to the list of room temp sensors
      all_temp_sensors: >
        {{ room_temp_sensors + [thermostat_temp_sensor] }}

      # Gather a list of the temperatures for all sensors
      all_current_temps: >
        {{ all_temp_sensors | map('states') | select('match', '^[0-9.]+$') |  map('int') | list }}

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
{% endraw %}
```

As you can see, these variables are making use of the fields defined above (`room_temp_sensors`, 
`current_hvac_mode`, and `thermostat_temp_sensor`).

At this point, we have the current temperature (`current_aggregate_temp`) which we'll use to compare
against the target temps and ultimately set the thermostat

### Get all desired temperatures

Our next step is to make the script aware of the desired temperature. As mentioned in the [previous
post]({% post_url 2025-07-16-hvac-helper-sensors %}#per-room-temperature-settings), if you don't
have a way to control the air flow between rooms, then a single entity for target temperature will
be sufficient; we'll still let the script accept a list of entities for the target temperature, and
you can just provide a list of one.

```yaml
{% raw %}
fields:
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
{% endraw %}
```

And now we'll do a similar treatment where we get a single target temperature from the list of
target temperatures which is provided to the script; again, we'll do this in the `variables` block

```yaml
{% raw %}
variables:
  # Gather a list of the temperatures for all sensors
  all_target_temps: >
    {{ room_target_temp_entities | map('states') | select('match', '^[0-9.]+$') |  map('int') | list }}

  # Determine the temp to use as the target temp; min temp if cooling, max temp
  # for heating.
  current_target_temp: >-
    {% if current_hvac_mode == "cool" %}
      {{ all_target_temps | min }}
    {% else %}
      {{ all_target_temps | max }}
    {% endif %}
{% endraw %}
```

### Decide on a course of action

At this point, we're mostly done with the hard stuff; the rest is pretty straightforward. Now that
we have the current temperature and desired temperature, we need to determine what to do with it. In
this, we create the first action of the script's sequence, which is to test the target vs the current 
temperatures and see if action is warranted.

In the next step, we'll be getting ready to define the actual temperature we want to send to the
thermostat, but in this step we're simply gathering three pieces of information based on which mode
we're in, heating or cooling. The three pieces of information are:

- Whether or not the HVAC system should start running (or, if already running, continue to run)
- What temperature we should target if we should _not_ run
- What temperature we should target if we _should_ run

In this case, "turning off the AC" is not actually telling the thermostat to go into "off" mode;
instead we'll be setting the thermostat to a temperature higher than the current temp. Conversely,
if we want the AC to turn on, then we'll send a temperature which is lower than the current temp. As
an example, if the current temperature is 77 and we want the AC to stop, we'll send a temperature of,
say, 79. Otherwise, if we want it to start running, we'll set the AC to target 75. The former will
cause the unit to stop running, the latter will cause the unit to start running. 

To help this, we're going to add a buffer to the temperature so we don't get caught cycling very
fast when the temperature is right on the threshold. We'll also add an overshoot value which will
help guarantee the desired operation of our system.

```yaml
{% raw %}
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
{% endraw %}
```

And we'll use them in the action step in the following way. The buffer will be added to the target
temperature (in cooling mode; subtracted otherwise) when testing; so if the buffer is 1 and the
target temperature is 75, we'll check to see if the current temperature is over 75 + 1 or 76
degrees; this will save a little energy and help to prevent the AC from cycling on and off more
rapidly. As for the overshoot, when we _set_ the target temperature to the thermostat, assuming we
have an overshoot of 3 degrees, when we want to turn on the thermostat set to 75, we'll instead
set it to 75 - 3 or 72 degrees; if we want to _turn off_ the thermostat, we'll instead use 75 + 3 or
78 degrees. This way, the HVAC system engages longer.

We set these values in the following action:

```yaml
{% raw %}
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
{% endraw %}
```

### Select the appropriate target temperature

Now that we have possible target temperatures and know whether or not we should engage, we build a
new action which decides upon the correct target temperature and sets it to a variable which will
be used soon. We do this in stages because it's easier to debug and reason about what is going on if
you break things down into multiple steps

```yaml
{% raw %}
sequence:
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
{% endraw %}
```

## Send the temperature to the thermostat, if appropriate

Before we actually send the temperature (`actual_target_temp` from above) to the thermostat, we should
see if the system is in the right mode for this. There's two things which could be preventing our
setting of the thermostat: if the system is disabled (meaning, if the binary sensor we created in the
last post is turned on) and if thermostat is not in the right mode:

```yaml
{% raw %}
sequence:
  - alias: Check to see if the HVAC system is disabled; don't continue if it's not
    condition: state
    entity_id: binary_sensor.disable_upstairs_climate_operation
    state: "off"

  - alias: Check to see if the thermostat is on; don't continue if it's not
    condition: template
    value_template: >-
      {{ is_state(thermostat, "heat") or is_state(thermostat, "cool") }}
{% endraw %}
```

These conditions only let the logic flow past if they are true; thus if either is false, the
execution stops right now. But, should these conditions pass, we can finally do the last piece
of logic:

```yaml
{% raw %}
    sequence:
      - alias: Update the thermostat's temperature
        action: climate.set_temperature
        target:
          entity_id: >-
            {{ thermostat }}
        data:
          temperature: "{{ actual_target_temp }}"
{% endraw %}
```

Congrats! That was a lot, but that's because it does a lot; you can see the whole script [here](#update-thermostat-script).

## Scheduling

### Short cycling prevention

Short cycling is when the system turns on and off too rapidly. Not only will this not adequately
manage the temperature, this can greatly reduce the life of the system. Thus, one of the first
steps we'll take is to avoid this. The simplest way (and the way we're going to use) is to not update
the target temperature too frequently; in our case, we'll run an update every 15 minutes.

To schedule this, we'll create an automation which will execute the script we just described. As
mentioned before, we are separating the script from the scheduling so we can execute the script from
multiple different triggers, as well as to be able to assign different conditions for each.

The automation itself is pretty straightforward, so I'll just touch on the various parts

### Triggers

Not only do we want to make this happen every 15 minutes, but we also want it to run at other times,
like when the upstairs HVAC is no longer disabled (e.g. when the windows are closed) or when we 
restart home assistant; that way, we don't have to wait for the next execution.

```yaml
{% raw %}
triggers:
  - alias: Every 15 minutes
    trigger: time_pattern
    minutes: "/15"

  - alias: Upon restarting Home Assistant
    trigger: homeassistant
    event: start

  - alias: When the windows are closed
    trigger: state
    entity_id: binary_sensor.disable_upstairs_climate_operation
    to: "off"
    for:
      seconds: 10
{% endraw %}
```

### Conditions

We only want the script to run if we're likely to be updating the temperature, so let's do some 
quick sanity checks first

```yaml
{% raw %}
conditions:
  - alias: HVAC is in automatic mode
    condition: state
    entity_id: input_boolean.hvac_manual_mode
    state: "off"

  - alias: We're currently in cooling or heating mode; we don't support others
    condition: state
    entity_id: input_select.hvac_mode
    state:
      - "cool"
      - "heat"

  - alias: The HVAC is not currently disabled due to windows being open
    condition: state
    entity_id: binary_sensor.disable_upstairs_climate_operation
    state: "off"
{% endraw %}
```

### Calling the script

Finally, we can call the script, passing in values for the fields we defined above as appropriate.
This is what it looks like for mine; note that any field not passed as part of the `data` object
is set to the default value defined in the script `fields`

```yaml
{% raw %}
actions:
  - alias: Call the script to update the thermostat
    action: script.update_thermostat_temp
    data:
      thermostat_temp_sensor: sensor.upstairs_thermostat_home_kit_temperature
      thermostat: climate.upstairs_thermostat_home_kit
      room_temp_sensors:
        # it would be good to convert this into a group
        - sensor.cora_room_temperature_friendly
        - sensor.office_temperature_friendly
        - sensor.guest_room_temperature_friendly
        - sensor.main_bedroom_temperature_friendly
      room_target_temp_entities:
        # it would be good to convert this into a group
        - input_number.cora_bedroom_target_temp
        - input_number.game_room_target_temp
        - input_number.main_bedroom_target_temp
        - input_number.office_target_temp
        - input_number.upstairs_base_target_temp
      current_hvac_mode: cool
{% endraw %}
```

### Putting it all together
You can find the full script [here](#scheduling-automation)

## Wrap up

Well, that was a lot! If you made it this far, congrats! As you can see, this is a pretty complex
set of instructions, but then it is a fairly complex system that we're dealing with here. Most of
this already happens under the hood inside a modern thermostat; it's just that I want a bit more
control over this and more ability to extend out to using the Flair system. With that said, I've had
this running in my house all summer and it works quite well... or, at least, it did on the few days
where it got hot enough to actually trigger the HVAC; it's been quite mild this summer, thankfully.

As for the Flair integration I mentioned: I'm still working on that. Since the summer has been nice,
I haven't felt compelled to integrate that quite yet. However, I'm sure it'll hot up towards the
beginning of autumn, urging me to make the improvements and get everything working together. I'll
share my configuration for that once I get to that point.

That's it for now; thanks for reading!

## YAML configurations

### Update Thermostat Script

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

      # Gather a list of the temperatures for all sensors
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

### Scheduling Automation
```yaml
{% raw %}
automation:
  - id: climate_automation_upstairs
    alias: Climate - Upstairs Control
    description: >-
      This is the main control script for the HVAC system upstairs. The main
      idea is that, upon every trigger, the target temp is calculated, the
      aggregate current temp is calculated, and the set point of the thermostat
      is updated accordingly.

      The target temp is the lowest of all the currently set room temperatures
      plus an offset; the offset is negative if cooling, positive if heating. By
      setting the temp beyond the actual target, we will prevent the possibility
      of rapidly cycling the HVAC system, which is bad.

      The aggregate current temp is the most extreme of all the rooms in which
      there is a temp sensor; the extreme is the highest if cooling and lowest
      if heating.

    triggers:
      - alias: Every 15 minutes
        trigger: time_pattern
        minutes: "/15"

      - alias: Upon restarting Home Assistant
        trigger: homeassistant
        event: start

      - alias: When the windows are closed
        trigger: state
        entity_id: binary_sensor.disable_upstairs_climate_operation
        to: "off"
        for:
          seconds: 10

      # Add this eventually
      # - alias: Upon manually changing the temperature

      # Add this eventually
      # - alias: Upon switching to guest mode

    conditions:
      - alias: HVAC is in automatic mode
        condition: state
        entity_id: input_boolean.hvac_manual_mode
        state: "off"

      - alias: We're currently in cooling or heating mode; we don't support others
        condition: state
        entity_id: input_select.hvac_mode
        state:
          - "cool"
          - "heat"

      - alias: The HVAC is not currently disabled due to windows being open
        condition: state
        entity_id: binary_sensor.disable_upstairs_climate_operation
        state: "off"

      # Add this eventually
      # - alias: HVAC is not in temporary override mode

    actions:
      - alias: Call the script to update the thermostat
        action: script.update_thermostat_temp
        data:
          thermostat_temp_sensor: sensor.upstairs_thermostat_home_kit_temperature
          thermostat: climate.upstairs_thermostat_home_kit
          room_temp_sensors:
            # it would be good to convert this into a group
            - sensor.cora_room_temperature_friendly
            - sensor.office_temperature_friendly
            - sensor.guest_room_temperature_friendly
            - sensor.main_bedroom_temperature_friendly
          room_target_temp_entities:
            # it would be good to convert this into a group
            - input_number.cora_bedroom_target_temp
            - input_number.game_room_target_temp
            - input_number.main_bedroom_target_temp
            - input_number.office_target_temp
            - input_number.upstairs_base_target_temp
          current_hvac_mode: cool
{% endraw %}
```