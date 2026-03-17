---
title: Micro-Creations
date: 2026-03-17
# categories are Family, Photography, Places, Projects, Reviews, Software, Thoughts
category: Thoughts
tags:
- ai
- software
media_subpath: /assets/img/posts/microcreations/
image:
    path: preview.jpg
    lqip: preview.lqip.jpg
---

There's something that bothers me about AI. Yeah, hot take, I know. But this time,
it's not the energy consumption or the intellectual theft or the vast amount of 
incorrect bullshit that's being spread with AI or even the fact that all AI company
logos [seem to look like buttholes][1]. No, what I want to talk about is this thing
I'm dubbing micro-creations.

To talk about this, let's talk about what a micro-creation is. The easiest way to
do this is to put it in the context of a larger project. Let's say that I'm writing
a new feature in my application. There's obviously a lot that goes into it: what
is it going to do, what API is going to be needed to interact with it, what will the
database schema look like, how am I going to make it performant, how will I make
it testable, etc. But really, that's just the tip of the iceberg.

Throughout the entire process of writing a feature, you have a ton of tiny decisions
to make. Let's just look at the database portion. A general design for a database
schema for a feature will include the tables, fields, interrelations between them, and
indexes for the relevant queries. But what about the names of each of the fields?
The types? Should we use a `varchar(100)` or is `varchar(50)` enough? Should we even
use `varchar`? And why am I using MySQL in 2026 anyway? Just that small portion of 
the design - create a structure that can persist the needed data - has a _ton_ of 
little decisions along the way. These are what I call micro-creations.

When a developer receives a design for a feature, she doesn't get a step-by-step guide
on what code to write; she gets at best a set of goals, a bunch of small
specifications for intended functionality that together create the feature. Within
the guidelines of desired functionality and the framework of the larger system to
which the feature is being added, she gets to decide how best to implement the feature.
From another perspective, she gets to coax the feature into reality from the various
building blocks available to her, to exercise creativity to solve the problem at hand.

You may look at writing code as a bunch of boilerplate and, depending on the framework,
language, code base, and feature, you'd certainly have a point. But even that is not
without its creative input. I gave the example of naming fields above, but what about 
naming variables, methods, classes? How you visually structure the code to best make sense?
How do you ensure that whatever algorithm and logic you're writing does the right thing?
Whether you use a `runCatching` block or a `try...catch` block? Whether or not to leave
comments and what to say in them? How and when to break up a larger function into
smaller functions? How to make this all testable? Resolving every single one of these
is a micro-creation.

This is all creative input that, even if you don't realize it, puts your own personal
stamp on it. You work in a code base with the same people for long enough, and you
start to recognize when code has been written by particular people. And because you've
left this personal mark, you start developing a feeling of ownership over it. _I_ made
this. I _made_ this. The reason you feel this is because, bit by bit, you created it, through all of these micro-creations.

And, from my perspective, this is exactly what AI-powered programming is now doing for
us. You give it a set of requirements (let's not get started on the fact that a good
deal of creativity is needed to get the _right_ output from AI) and it writes the
entire feature for you. Much of the time, it's good. Sometimes you have to iterate,
but that's fine, you're not perfect either. But at the end of the day, you likely haven't
written a lick of code. Sure, you now have a PR with 450 lines of change, and sure you
guided the creation of it, and sure you did it in half the time you normally would have,
but you don't feel the same way about it as if you had written it all by hand. You gave
all the micro-creations away to AI to perform. You feel like less of a creator.

Perhaps this doesn't bother you. That's fine. I can't really say that I'm super
bothered by it either. But I _have_ noticed that I feel more and more detached from
my work, less and less like I understand the code in the code base, and this is despite
getting more involved and having "written" a growing percentage of that code. Because...
I didn't. I didn't _create_ the code, I _guided the creation_ of it. Sure, my creativity
is sometimes flexed when I have to describe what I want done, but... that's it. I write
a paragraph or two, wait a while, then test it. I don't feel any real sense of
accomplishment or ownership of it; it's code that now exists and I have a very neutral
emotion which comes from that. Perhaps this is why I only use AI coding at work and
not in my home stuff...

You know what it reminds me of? Moving into management. When I did so, I was suddenly
responsible for the code being written, but not for actually writing the code because
I had people whose job it was to write the code I wanted to be written. I know the
parallel between AI and the most junior of engineers has been made, but having gone from
IC to management, I feel like I can identify with the specific-yet-somehow-vague feeling
of loss that accompanied my no longer performing these micro-creations. I design the
features, I guide them to completion, but I'm not _building_ them, and that ends up giving
me a different feel.

Any rate, if you have felt that development is not as rewarding using AI even though
your productivity has shot up, perhaps this is why. So what can you do about it? I
dunno; maybe find creativity elsewhere. Maybe manually code a small portion of every
feature. Maybe commit to only doing a rough draft with AI, then doing further
iterations manually. Maybe only use AI for code reviews. Maybe something else. I don't
know. Perhaps you'll have to find a solution that works for you; you know... be creative.

[1]: https://velvetshark.com/ai-company-logos-that-look-like-buttholes