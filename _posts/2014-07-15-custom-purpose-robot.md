---
title: Custom Purpose Robot
date: 2014-07-15
category: Projects
tags:
- lego
- software
- programming
- robot
---

I got an idea for a custom-purpose robot. Basically, the idea is to make something which is able to take a DVD off a
stack of DVDs and put it in a DVD tray. Then, the computer rips the DVD to a movie file. Once the rip is done, the DVD
tray opens up. The robot should then take the DVD out of the tray and move it onto a "ripped" stack, pick up a new DVD,
and repeat the process.

This is going to be an interesting problem. There are several different components of this which need to work well
individually and be combined into one system that works well together. First, getting the DVDs off a stack. I'm thinking
of using something like a track with rubber tires that slides the disk off the top of the stack. Another thing I'll have
to do is get the DVD centered on the tray. This I can do by putting a post up through the hole in the DVD once I get the
disk in the right place laterally. There could be an angled piece which holds the disk in place and lowers it.

Then there's the whole "triggering the rip" thing. I'm looking at a Microsoft .NET API library for interacting with the
control brick. If it works, I may be controlling it via a desktop program rather than through the brick... which is
fine; I can use real programming for that. But I'll need it to do all the various routines that actually move things
around. After the disk should be in place, I'll close the disk tray and trigger the rip.

Once the rip is done, I can do some sort of grabbing thing to move the disk off to clear the way to start back up at the
top. This is gonna be kinda fun!
