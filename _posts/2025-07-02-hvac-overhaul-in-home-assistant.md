---
title: HVAC overhaul in Home Assistant
date: 2025-07-02
# categories are Family, Photography, Places, Projects, Reviews, Software, Thoughts
category: Projects
tags:
- homeassistant
- automation
- smarthome
- climate
media_subpath: /assets/img/posts/hvac-overhaul-in-home-assistant/
image:
    path: preview.jpg
    lqip: preview.lqip.jpg
    alt: Credit to Sean D on Unsplash https://unsplash.com/@paus_d_
---

You know those projects where you start doing something and pretty quickly think "why am I doing this?
Isn't the default behavior good enough? Why should I customize this?" If you _don't_ ever think
that, then it's clear you've never gotten into home automation...

Managing temperature in a home is what they call a "solved problem"; we have thermostats, they 
keep track of the temperature, and they turn on/off the HVAC system to keep the temperature within
a certain range, depending on the mode. So why do I feel the need to create a set of automations
which do _basically_ exactly the same thing my thermostat wants to do?

Well, to put it simply, I'm convinced that I can do it better than my thermostat can, based on the
circumstances. Sure, that's probably the hubris talking, but I feel like my thermostat could... well,
let's just say it could use some help. Lemme go through what challenges my system has and point out
a few things I want to happen which aren't really happening.

# The System

First, let's talk about the system; what exists, some of the challenges I have, etc.

## HVAC
I have a two-zone system, upstairs and downstairs. We're only going to concern ourselves with the
upstairs since downstairs seems to be generally fine. There are four rooms we're concerned with:
main bedroom, office, Cora's bedroom, and the game room. The thermostat, an Ecobee 3 Lite Smart
Thermostat is in the main bedroom, which also happens to be the coolest room. In summer the sun bakes
the office and Cora's room, and they can be almost 10 degrees hotter than the main bedroom. Thus, if
the thermostat is on AC mode set to, say, 77 deg, the main bedroom can be 75 during the day while the
other rooms are 82 degrees or more.

I installed remote temperature sensors (the SmartSensor for rooms, also from Ecobee) in each of the
"satellite" rooms which can help the thermostat get a better idea of what the true temperature is,
but it still will only cool to an average, meaning the satellite rooms will still be hotter than the
average target temperature.

On top of this, the main bedroom has a _huge_ register (12" x 12") and is right next to the system
blower motor; thus, the bulk of the cooling airflow will go into the main bedroom, cooling that room
even more effectively, bringing the average down without much impact on the rooms which really need
it.

## Flair

To mitigate the above imbalance a bit, I installed some [Flair Smart Vents](https://flair.co/) which
can adjust and redirect the airflow to different areas under its control. I installed these last year,
and they made a noticeable difference in the comfort level of the satellite rooms; the system would
close the main bedroom vent, redirecting all the cooling power to the satellite rooms. However, using
this system had some other challenges, mostly around how to interact with the system. The only way
to set room temperatures was either using the app (which is inconvenient and kinda clumsy) or by
adding a thermostat-type device in each room (Flair sells some for $120 each, which seems super steep
to me). Further, depending on the mode, if one wants to adjust the temperature manually/temporarily
and changes the thermostat, the Flair system will just overwrite that, leading to confusion and
frustration.

## Why Not Just Crank It?

Well, now I hear the question "why not just cool to something a lot lower, like 72?" While that would
definitely cool the satellite rooms to something more comfy, there's a couple reasons we don't want
to do that. First, we don't tend to find 72 comfortable and, if we average 72, the main bedroom will
be _very_ chilly even if the satellites are not. Second, we don't want the AC compressor running all
the time; we've burned out two fans since we've lived in this house (we feel like it's a fault with
the hardware since we _really_ don't run the AC enough to justify that) and we don't want to continue
that trend. Finally, we don't want the power consumption. While we do have solar (15kW system), we
like having an offset so our bills are lower. Also, just generally using less power is a good thing.
We feel the current system is inefficient so changing the way it functions, evening out the
temperatures, is our first priority.

# Desired Outcomes

Now that we have a good idea of what the issues are, let's make a list of what we want to achieve
with a solution. Note that where I say "cooling", I also mean "heating" in the winter, but really
summer is the only real issue here

## Must haves

If the end result doesn't have these, we can consider it to be a failure. Further, a solution is
considered "complete" if it does all of these things.

- Per room temperature settings
- Time-based temperature settings
- Adjustible manually without an app
    - If it's adjusted manually, it should go back to the regularly scheduled program at some point
- Disables HVAC if windows are open (I'm not paying to cool the outside)
- Balanced cooling; if the temp is set to 75, all rooms should be 75 (or reasonably close)

## Nice to haves

It would be great to do these things also, but it doesn't _have_ to; we can add them later

- Pre-cooling the bedrooms at bedtime based on projected temperatures
- Responding to PG&E high-usage emails by adjusting the temp settings
- Separate "guest mode" (but this is probably only relevant for downstairs)
- Away mode vs home mode which autodetects whether anyone is home
- Tracking occupancy and changing temperature if nobody is in the room


# Next Steps 
Fortunately, we have everything we need to do all of these things integrated into Home Assistant. We
have the aforementioned room temp sensors, thermostats, and Flair smart vents all hooked up, but we
also have window sensors and occupancy sensors in all the rooms, the ability to read emails to a
specific email account, and know when people are home vs not using the mobile app integration.

Thus, we'll piece all of this together, bit by bit. This post got away from me a little, so I'll
plan to do these in later posts; setting up what sensors we need, what helpers, and how to link
everything together to make a fully integrated climate system.... 85% of which we could probably
do natively in Flair and Ecobee apps, but where's the fun in that?

The way I see it, there's four major phases to
this project, and I'll cover each in its own post:

1. **[Helpers and automation prep]({% post_url 2025-07-16-hvac-helper-sensors %})** in which we prep all the sensors we'll need to do the subsequent steps
2. **HVAC Automation** which takes the sensors and directly controls the thermostat temperature/mode
3. **Flair Automation** which adds onto the HVAC automation by controlling where the air flows
4. **Additional Stuff** such as guest mode, away mode, etc., things which I want but aren't needed for daily operation (meaning I will likely ignore them forever)

So hang on and I'll publish posts as each step gets sorted!