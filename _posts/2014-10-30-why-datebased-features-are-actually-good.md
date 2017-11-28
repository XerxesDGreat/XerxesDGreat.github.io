---
title: Why Date-based Features are actually good
date: 2014-10-30
category: Thoughts
tags:
- software
- product
---

I know I don't talk about work or work-related subjects very frequently, but considering how much of my time it takes up,
I've started to wonder why not. I mean, it can't be all because of NDA's and trade secrets and the like. After all,
let's face it, nothing I've done in the last 5 years has been highly cutting edge or completely unique. Perhaps I'll
discuss why that's not depressing to me later. In any case, I have some thoughts to share on lots of different subjects:
why things matter and/or why they don't matter, mostly.

To kick things off, I'll refer to a conversation which was going around the other day. We were discussing the design of
a feature and one of my team members, in order to identify why we can't do something, stated that this is a "date-based
feature", and the statement made it clear that this was a Very Bad Thing. This piqued my curiosity: what is inherently
bad about a date-based feature?

If you don't know, a feature typically has two main permutations: date-based and design-based. A design-based feature
would be one which ships after the design has been agreed upon, all the development of the feature is addressed and
executed, and any iterations which come up are addressed. The philosophy here is that, if there is an unseen change or
obstacle in the development of the feature, whether in the design or in the technology, the date on which we ship the
feature will slip. Conversely, for a date-based feature, scoping and planning the feature happens, and the team commits
to the date; if the same unseen change or obstacle comes up, sacrifices must be made because we still have to ship on
the same date.

A short deviation. For the sake of brevity, I'm going to boil down every feature into two development disciplines:
design of the feature (what is the feature going to do), and technology (how is it going to do it). In the real world, 
there are more components than just this, but these two disciplines will still be the bulk of all major decisions in the
development process.

The complaint which my teammate raised was that, since we're working with a date-based feature, it inherently wouldn't
be as good as a design-based feature. And sure, there is validity to that. If we commit to shipping on a specific date,
unless that date has already incorporated major iteration time, it doesn't allow for surmounting major obstacles. What
happens if we change the design of the feature in some meaningful way? What happens if it's not possible to use the tech
stack how we'd anticipated doing? We now have to address these issues as well as all the remaining and pertinent original
work. Sometimes, and this is rare in my experience, this will cause a reduction of scope, which doesn't cause a problem.
Almost always, this means we now have more scope. More scope equals more work to complete in the same amount of time.
This will cause employees working more hours, will cause the trimming of various pieces of the feature in order to
reduce scope sufficiently (a.k.a. cutting corners), or both.

By contrast, a design-based feature waits for the feature to be complete and "perfect" before releasing it. If there are
any roadblocks along the way, they're addressed as they come up. Major roadblocks can end up delaying the release of the
feature for a very long time, but you can be assured that the feature is the best you can get, technically and in
design. Therefore, you don't have to worry about cutting parts of the feature, working large amounts of hours to make up
for increased scope, etc.

#### What is the value of releasing? 

If you release the wrong feature, it will be unsuccessful. This can be looked at in a couple ways. For instance, what
happens if you have a good idea implemented poorly? This is more likely to happen in the case of a date-based release
system. You've had to leave a couple things off which, while they're not essential to the functionality of the feature,
they certainly make the feature more user friendly.
