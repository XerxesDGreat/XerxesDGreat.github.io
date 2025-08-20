---
title: Flair Vent Automation
date: 2025-08-14
# categories are Family, Photography, Places, Projects, Reviews, Software, Thoughts
category: Software
tags:
- homeassistant
- automation
- smarthome
- climate
media_subpath: /assets/img/posts/flair-vent-automation/
image:
    path: preview.jpg
    lqip: preview.lqip.jpg
---

Well, it finally happened: summer hotted up. This has been a very windy and generally cool summer
(which is fine by me) but about a week after publishing the [last post][6]
about my HVAC system, we finally got some days in the high 80s or low 90s; basically hot enough
for the AC to kick on.

Now, the previous iteration I did with the HVAC system works _okay_; I just made sure to crank the
target temperature in the office down so it could eventually get cool. Of course, this means that
other rooms _also_ get that cooling as well, and since they're starting from a cooler temperature,
they get downright chilly. If only there were some way to _only_ cool my office...

Oh yeah, duh, that's totally why I installed [Smart Vents by Flair][1] last year. These install
in place of the standard HVAC registers in rooms but they have a motor, batteries, and some smarts
in them so the base unit can open and close them individually, directing air towards or away from
any room. In my case, these can direct the output of the AC away from the main bedroom (the
coolest room upstairs, and _also_ the room with the thermostat) and towards my office and my
daughter's room (the warmest rooms upstairs).

> Just a quick note: throughout this article, I'll likely be talking in the case where we need to
> cool a room down and so the target temperature is lower than the current temperature. This is
> also going to be applicable during heating season, just going the opposite direction. As it's
> clumsy to call that out in every instance, I will likely not mention it, so just keep in mind that
> all the automations do consider that, even if not called out in the words.
{: .prompt-info }

## Talking about Flair

The first thing I had to do was ensure I have everything in Home Assistant. This is pretty
straightforward; it's just a matter of installing the [Flair integration][2] through HACS and
following the setup instructions. Once you do that (and restart Home Assistsant, probably), you'll
see the various Flair devices you've installed.

![Flair devices in the integration](integration-listing.jpg){: lqip=integration-listing.lqip.jpg }
_Flair devices in the integration_

Quick explanation: the "Home" device is globally for the house and HVAC system; its main use is
home/away and schedules, though we won't be using that. The "Flair Bridge" device is just info about
the hardware bridge box thing. Then each room will have two different devices: a "Flair Control" and
a "Vent". The "Flair Control" isn't really useful to us because it provides a way to interact with
Flair _when it is controlling the system_. As we're going to be managing everything, we won't use
this device or the related entities. In any case, if the Flair system is in Manual mode (which we
will be), they won't even be available; they only show up when Flair is in Auto mode. Finally, we
have the "Vent"; this gives us a temperature (which I don't believe because it's right next to
where cold/warm air blows and are in my ceiling) and the ability to open/close the vent; this will
be used later.

One other thing I've noticed: opening or closing the vent from Home Assistant takes a Very Long
Time™; if you tell the vent to open, it can be close to a minute before the vent responds. This is
only really noticeable when you're manually opening/closing the vents; if you're not sure when the
automation is running, you won't notice it taking a while.

Well, now that we have the Flair system installed, and we have everything from the previous posts,
let's start putting things together!

## A big problem

The way I built the last automation made a lot of sense; cool the warmest room down until it hits
the lowest desired temperature. It's straightforward and having different temperatures in each room
didn't really matter. However, with Flair, we have to rethink this.

At first, I tried to just add Flair controls to the existing automations, but it quickly became
apparent that Flair and the automation had different ideas in terms of priorities and therefore
wouldn't be able to operate effectively. Also, as they are two separate systems, they'd have to 
have a way to talk back and forth between each other and it was just a messs. So I decided to start
from scratch; this is the result of that reimagining and I think it's a bit more efficient now,
though I feel there's still an optimization to be made.

## Per-room temperatures

Since Flair gives me the opportunity to actually do per-room temperatures, I decided to use that
as a starting point. The philosophy we're going to follow is that Flair will be in charge of
directing the air to rooms and will therefore be the system that knows about temperature, while the
HVAC system only needs to know "turn on" or "turn off". This removes the need to aggregate
temperatures and decide which one to use, instead leaving us with two decisions:

- for each room, should its vent be open?
- should the thermostat be on or off (read: temp lower or higher than the current temp)?

Thus, let's break this script down into two components, one for each.

### Should the vent be open?

This should be relatively straightforward: given a temperature sensor and a target temperature input
number for a room (both of which were described in [a previous post][3]), is the target temperature
higher than the current temperature? If so, the vent should be open; if not, the vent should be
closed. 'Nuff said, case closed, ship it.

There's only one problem: we have more than just one room; how do we let the script know about
multiple rooms?

After a bit of trial and error, I came up with two major ways for the script to handle different
rooms: through fancy tagging of the various sensors and numbers and even fancier queries in the
script, or just being structured about what we pass into the script. Here's a bit of the pros and
cons of each, along with an explanation of why we're going with our chosen method.

### Grouping by room

The first method leads to a cleaner interface for the script; we just have to tell the script "here
is the room I want to monitor" and the rest will be managed through labels. However, this requires
a little set up using some of the features that Home Assistant provides.

As you know, you can assign an [area][4] to each entity; for example, the office temperature sensor
and the office target temperature can be added to an area called "Office".

![Office temperature entities](office-temperature-entities.jpg){: lqip="office-temperature-entities.lqip.jpg" }

The second feature we'll use is the [labels][5] feature; each entity or device can have multiple
labels which provide a different way to group entites while also allowing an entity to belong to
multiple groups. To illustrate this, here's the same two entities from the example above, only with 
some labels added to show their function

![Office temperature entities with labels](office-temp-entities-with-labels.jpg){: lqip="office-temp-entities-with-labels.lqip.jpg" }

With those two things in place, we can pass a list of rooms into our script; then when the script is
executed, we can loop through each of the rooms, find the entity in that room with one of these
specific labels, and then use that entity to determe what the delta is. So first, we'll set up the
script to accept a list of the rooms we're watching

```yaml
{% raw %}
    fields:
      rooms:
        name: Climate Controlled Rooms
        description: >-
            Rooms that have flair vents and should be controlled in a group by this script. Each
            room needs to have a single entity labeled "Target Temp", a single entity labeled
            "Current Temp", and a single `cover` entity in the Flair integration.
        example: '["Office", "Main Bedroom"]'
        selector:
          area:
            multiple: true
            entity:
              domain: cover
              integration: Flair
{% endraw %}
```

Now, we'll use those rooms and the current HVAC mode (added [later](#the-rest-of-the-owl) along with
other common inputs) to build a list of vents and their desired state. Comments have been added
throughout the below section, in `{# #}` format

```yaml
{% raw %}
    # Actions to take
    sequence:
      - alias: Go through the rooms and determine the desired state for each vent
        variables:
          
          # get the current hvac mode; hvac_mode_selector will be added as a field later
          current_hvac_mode: "{% states(hvac_mode_selector) %}"

          # build a list of the vents with their desired states
          vents_with_desired_states: >-
            {# a collection to hold the vents and whether they should be open #}
            {# we use the ns/namespace because otherwise it wouldn't update #}
            {% set ns = namespace(vent_wanted_states=[]) %}

            {% for room in rooms %}
              {# fetch office entities #}
              {% set office_entities = set(area_entities("Office")) %}

              {# find the current temp #}
              {%- set current_temp = states(office_entities
                .intersection(label_entities("Current Temp"))
                | list
                | first) -%}

              {# find the target temp #}
              {%- set target_temp = states(office_entities
                .intersection(label_entities("Target Temp"))
                | list
                | first) -%}

              {# determine whether the vent needs to be open to change the temp #}
              {% set should_be_open = target_temp < current_temp
                    if current_hvac_mode == "cool"
                    else target_temp > current_temp %}
            
              {# get the vent for the room #}
              {% set vent = office_entities
                | select("match", "cover")
                | first %}
            
              {# add the vent and its state to the response list #}
              ns.vent_wanted_states = ns.vent_wanted_states + [{
                'vent': vent,
                'should_be_open': should_be_open
              }]
            {% endfor %}
            {{ ns.vent_wanted_states }}
{% endraw %}
```

As you can see, it's pretty straightforward to get the information from entities starting with each
room, then build a list of the vents that want to be open. However, this comes with a big challenge:
what happens if I apply one of the labels to more than one entity in the room, or if I add smart
blinds which would also be returned as a "vent"? This solution requires a bit more diligence when it
comes to setting up and maintaining the entities in a room, so it feels more fragile to me. Of
course, I could also add a common label to all of them (e.g. "Climate") so I could look for that as
an additional filter, but that still feels a bit tenuous to me. Therefore, I went with the other way
to handle this.

### Pass in lists of entities

For this method, we'll explicitly pass in each of the sensors we're going to use. The logic to 
gather the `vent_wanted_states` will be basically the same, just restructured around the different
script inputs. However, this _requires_ that we pass in the same number of entities for each of the
three inputs and in the same order. To illustrate this, assume we pass in a list of `[office temp
sensor, main bedroom temp sensor]` to the current temperature sensors input; for the script to
work properly, we'll also have to pass in `[office target temp, main bedroom target temp]` and 
`[office vent, main bedroom vent]`, in those orders.

So, how is this a benefit over the previous way? In my opinion, having to be explicitly declarative
about what is included brings the point of failure down to one location: whatever calls the script.
If the other method isn't working properly, we have to go find out why by filtering by several
different areas and labels, which is less straightforward. However, I will agree that the previous
method _looks_ fancier, and if that's the method you want to use, fine. I'm sticking with this one,
which is written out here:

```yaml
{% raw %}
    fields:
      room_temp_sensors:
        name: Room Temperature Sensors
        description: >-
          A collection of room temperatures which should be considered when
          calculating whether to engage or disengage the HVAC system. These are
          likely to be temp sensors in the rooms you want covered. This _must_ be in
          the same order and have the same number of items as `Flair Vents` and 
          `Room Target Temp Entities`
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
          or it can be a list (e.g. "cool this room to 75, that room to 78"). This _must_ be in
          the same order and have the same number of items as `Flair Vents` and 
          `Room Temp Sensors`
        example: "['input_number.office_target_temperature', 'input_number.bedroom_target_temperature']"
        required: true
        selector:
          entity:
            filter:
              - domain: input_number
            multiple: true

      flair_vents:
        name: Flair vents
        description: >-
          A collection of Flair vents for the rooms. This _must_ be in
          the same order and have the same number of items as `Room Target Temp Entities` and 
          `Room Temp Sensors`
        example: "['cover.office_vent', 'cover.bedroom_vent']"
        required: true
        selector:
          entity:
            filter:
              - domain: cover
            multiple: true
{% endraw %}
```

As you can see, we've defined three lists of entities which need to be passed in when executing
the script. Now, we'll update the selection algorithm to build the same structure as in the previous
method. Again, we're assuming the existence of an `hvac_mode_selector` field which we'll define in
the next section. Also again, I've added comments using the format `{# #}`

```yaml
{% raw %}
    sequence:
      - alias: Go through the rooms and determine the desired state for each vent
        variables:
          
          # get the current hvac mode
          current_hvac_mode: "{% states(hvac_mode_selector) %}"

          # build a list of vents with their desired states
          desired_vent_states: >-
            {% set ns = namespace(room_wanted_states=[]) %}

            {# Loop over all the vents to get each desired state #}
            {% for vent in vents %}

              {# fetch the current and target temps for this room based on its location in the list #}
              {% set current_temp = states(room_temp_sensors[loop.index - 1]) | float %}
              {% set target_temp = states(room_target_temp_entities[loop.index - 1]) | float %}

              {# determine whether the vent needs to be open to change the temp #}
              {% set should_be_open = target_temp < current_temp
                    if current_hvac_mode == "cool"
                    else target_temp > current_temp %}
            
              {% set ns.room_wanted_states = ns.room_wanted_states + [
                {
                  'vent': room.vent,
                  'should_be_open': should_be_open
                }
              ] %}
            {% endfor %}
            {{ ns.room_wanted_states }}
{% endraw %}
```

As you can see, the logic is a bit simpler, mostly because we don't have to go and find the
appropriate temperature entities in each loop. That simplicity is at the cost of having more inputs,
but I feel it's a decent tradeoff. This is also a bit more efficient, but I don't super
care since there's only four rooms to deal with; we're talking a difference of milliseconds, which
I guarantee you won't notice in day-to-day life.

## The rest of the owl

So at this point, regardless of the method chosen, we have a list of the vents along with whether 
each should be open or not. From here, there are two things we need to do: decide the temperature
to set the thermostat at in order to make it run or not, and then set the vents to their desired
state. This logic is pretty straightforward and I've already given some of an example of it in the
previous posts in this series, so I'll just cut straight to the code, but add some commentary where
needed.

First, let's flesh out the rest of the fields we'll be using in the full script logic. Some of these
won't necessarily be used and will have defaults (like `buffer` and `overshoot`) but I like having
them as overrideable fields. Feel free to move them to constants defined in a `variables` block if
you disagree.

```yaml
{% raw %}
    fields:
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
    
      # told you we'd add it!
      hvac_mode_selector:
        name: Current HVAC Mode Selector
        description: >-
          Entity which stores the mode which the HVAC system is currently in. Accepted states of the
          entity are "cool" and "heat".
        example: cool
        required: true
        selector:
          entity:
            filter:
              - domain: input_select
{% endraw %}
```

Now we need to determine the actual temperature to use; we first determine what the temp will be if
the HVAC system is engaged or not, take a look at how many vents are open (remember, that's our
proxy for whether we should engage the HVAC or not), then we decide which to use based on how many
vents are open.

```yaml
{% raw %}
    sequence:
      - alias: Calculate the target temp
        variables:
          current_thermostat_temp: "{{ states(thermostat_temp_sensor) | int }}"

          # Set the "on" temperature to the lowest/highest target temp to ensure it kicks on
          engaged_temp: >-
            {% set room_target_temps = room_target_temp_entities | map('states') | map('float') | list %}
            {% if current_hvac_state == 'cool' %}
              {% set target_temp = (room_target_temps | min) - overshoot %}
            {% else %}
              {% set target_temp = (room_target_temps | max) + overshoot %}
            {% endif %}
            {{ target_temp }}

          # Set the "off" temperature to something over/under what the thermostat currently feels it is
          disengaged_temp: >-
            {% if current_hvac_state == 'cool' %}
              {% set target_temp = current_thermostat_temp + overshoot %}
            {% else %}
              {% set target_temp = current_thermostat_temp - overshoot %}
            {% endif %}
            {{ target_temp }}

          # Need to know how many open vents are desired; if we have zero, then each room is at its
          # target temperature and we can turn off the HVAC
          count_of_open_vents: "{{ desired_vent_states
            | selectattr('wants_open', 'eq', true)
            | list
            | count }}"

          actual_target_temp: "{{ engaged_temp if count_of_open_vents > 0 else disengaged_temp }}"
{% endraw %}
```

Now, once we've used one of the earlier methods to determine the desired vent states and we've
done the target step, we have to update the vents, opening or closing them as needed

```yaml
{% raw %}
      - alias: Go through the vents and set each to its desired state
        repeat:
          for_each: "{{ desired_vent_states }}"
          sequence:
            if:
              - alias: test the desired vent state
                condition: template
                value_template: "{{ repeat.item.wants_open }}"
            then:
              - alias: vent wants to be open
                action: cover.set_cover_tilt_position
                target:
                  entity_id: "{{ repeat.item.vent }}"
                data:
                  tilt_position: 100

            else:
              - alias: vent wants to be closed
                action: cover.set_cover_tilt_position
                target:
                  entity_id: "{{ repeat.item.vent }}"
                data:
                  tilt_position: 0
{% endraw %}
```

Finally, our last step is to set the thermostat temperature to that which we calculated a bit ago.
As mentioned before, this is the "engage or disengage" step.

```yaml
{% raw %}
      - alias: Update the thermostat's temperature; this could turn it on or off
        action: climate.set_temperature
        target:
          entity_id: "{{ thermostat }}"
        data:
          temperature: "{{ target_temp }}"
{% endraw %}
```

At this point, we have all the building blocks for the script. I've assembled everything into one
large script [below](#full-script), doing a few rearrangements for a bit more efficiency.

## Automating this script

And that's about it; we now have two chunks of code, one for determining which vents want to be
open, and the other setting the vents to their state and updating the thermostat. You can choose 
whichever of the above approaches to take and put them together. As for an automation, we'll
be calling this script from the automation we described in the previous post about [automating the
HVAC system][6], making sure to pass in the correct parameters, As an example, here's how I'm
calling my version of the script from the automation:

```yaml
{% raw %}
      - alias: Call the script to update everything
        action: script.update_hvac_settings
        data:
          thermostat_temp_sensor: sensor.upstairs_thermostat_home_kit_temperature
          thermostat: climate.upstairs_thermostat_home_kit
          room_temp_sensors:
            - sensor.cora_room_temperature_friendly
            - sensor.game_room_temperature_friendly
            - sensor.main_bedroom_temperature_friendly
            - sensor.office_temperature_friendly
          room_target_temp_entities:
            - input_number.cora_bedroom_target_temp
            - input_number.game_room_target_temp
            - input_number.main_bedroom_target_temp
            - input_number.office_target_temp
          flair_vents:
            - cover.cora_room_vent
            - cover.game_room_vent
            - cover.main_bedroom_vent
            - cover.office_vent
          hvac_mode_selector: input_select.hvac_mode
{% endraw %}
```

I still have that running every 10 minutes if the HVAC system is active, and it's worked well for
some time now. I hope it works out for you; thanks for reading!

## Full script

Well, I say "full"; I've still left out the core logic for the two disparate methods of getting the
vents which want to be open, but have notated where the logic should go

```yaml
{% raw %}
script:
  update_hvac_settings:
    alias: Climate - Update HVAC Settings
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

      hvac_mode_selector:
        name: Current HVAC Mode Selector
        description: >-
          Entity which stores the mode which the HVAC system is currently in. Accepted states of the
          entity are "cool" and "heat".
        example: cool
        required: true
        selector:
          entity:
            filter:
              - domain: input_select

      #
      # Add the field definitions for your desired selection method here
      #


    # set up some variables for the script execution
    variables:
      overshoot: "{{ overshoot | default(2) | float }}"

      # We'll also need the thermostat current temp for future use
      current_thermostat_temp: "{{ states(thermostat_temp_sensor) | int }}"

      current_hvac_state: "{{ states(hvac_mode_selector) }}"

    sequence:
      - alias: Go through the rooms and determine the desired state for each vent
        #
        # Add the logic for your desired selection method here
        #

      - alias: Calculate the target temp
        variables:
          current_thermostat_temp: "{{ states(thermostat_temp_sensor) | int }}"

          # Set the "on" temperature to the lowest/highest target temp to ensure it kicks on
          engaged_temp: >-
            {% set room_target_temps = room_target_temp_entities | map('states') | map('float') | list %}
            {% if current_hvac_state == 'cool' %}
              {% set target_temp = (room_target_temps | min) - overshoot %}
            {% else %}
              {% set target_temp = (room_target_temps | max) + overshoot %}
            {% endif %}
            {{ target_temp }}

          # Set the "off" temperature to something over/under what the thermostat currently feels it is
          disengaged_temp: >-
            {% if current_hvac_state == 'cool' %}
              {% set target_temp = current_thermostat_temp + overshoot %}
            {% else %}
              {% set target_temp = current_thermostat_temp - overshoot %}
            {% endif %}
            {{ target_temp }}

          # Need to know how many open vents are desired; if we have zero, then each room is at its
          # target temperature and we can turn off the HVAC
          count_of_open_vents: "{{ desired_vent_states
            | selectattr('wants_open', 'eq', true)
            | list
            | count }}"

          actual_target_temp: "{{ engaged_temp if count_of_open_vents > 0 else disengaged_temp }}"

      - alias: Update the thermostat's temperature; this could turn it on or off
        action: climate.set_temperature
        target:
          entity_id: "{{ thermostat }}"
        data:
          temperature: "{{ target_temp }}"

      # NOTE: At this point, the thermostat will have been updated by either the engaged
      # temperature if >0 vents want to be open, or the disengaged temperature if there
      # are no vents that want to be open. We're using the "vents should be open" as a
      # proxy to determine if temperature manipulation needs to happen; that means there's
      # at least one room that wants some cooling/heating. Now we will go and update the
      # vents to be in their desired positions. If we have zero vents open, the thermostat
      # should have been triggered to go off, else the thermostat will be getting ready
      # to blow. However, if there are no vents to be opened, then we can just ignore the
      # last step; this may leave one vent open, but that's okay.

      - alias: Check for vents to open; if none, then no need to continue
        condition: template
        value_template: "{{ count_of_open_vents > 0 }}"

      - alias: Go through the vents and set each to its desired state
        repeat:
          for_each: "{{ desired_vent_states }}"
          sequence:
            if:
              - alias: test the desired vent state
                condition: template
                value_template: "{{ repeat.item.wants_open }}"
            then:
              - alias: vent wants to be open
                action: cover.set_cover_tilt_position
                target:
                  entity_id: "{{ repeat.item.vent }}"
                data:
                  tilt_position: 100

            else:
              - alias: vent wants to be closed
                action: cover.set_cover_tilt_position
                target:
                  entity_id: "{{ repeat.item.vent }}"
                data:
                  tilt_position: 0
{% endraw %}
```

Again, thanks for reading!


[1]: https://flair.co/
[2]: https://github.com/RobertD502/home-assistant-flair
[3]: {% post_url 2025-07-16-hvac-helper-sensors %}
[4]: https://www.home-assistant.io/docs/organizing/areas/
[5]: https://www.home-assistant.io/docs/organizing/labels/
[6]: {% post_url 2025-07-23-automating-hvac-system %}