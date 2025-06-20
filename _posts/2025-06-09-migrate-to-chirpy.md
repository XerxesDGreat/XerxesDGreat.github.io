---
title: Migrating to Chirpy
date: 2025-06-09
category: Software
tags:
- website
media_subpath: /assets/img/posts/migrate-to-chirpy/
image:
    path: preview.png
    lqip: preview.lqip.jpg
---

I took a look at my webste the other day and, for whatever reason, I just wasn't in love with the way it looks any more. It happens; I mean, the last time I'd updated the look was something like 8 years ago. However I was really surprised the depth of my feelng, so I decided to do something about it.

![A disappointed man](harold.jpg){: lqip="harold.lqip.jpg" }
_This is approximately how I felt_

Some time into looking for a new website template I realize that there have _also_ been a ton of new blog frameworks and a general movement towards things like Wix, Squarespace, etc. As I wanted to keep my current setup (write in Markdown using the Jekyll framework so I can use Github Pages to publish my site), I wasn't interested in any of that, so I had to _really_ start digging. I was also pretty adamant that I not go the way of one-page sites; static HTML is fast, and that's important to me.

The other thing that was important is I didn't want to manually build out the templates; I used to do that, but I just don't have the patience for it.

![No time for that](no-time.jpg){: lqip="no-time.lqip.jpg" }
_Seriously_

So, when I found a nice, clean website that works extremely well with Github, I jumped on it. The theme is called [Chirpy](https://chirpy.cotes.page/) and I think it looks great. At some point, I'm gonna go through and see if I can add a bit of color, but for now I'm quite satisfied with it. I mean, it even has dark mode!

![So hot right now](dark-mode.jpg){: lqip="dark-mode.lqip.jpg" }

Getting it installed was _super easy!_... as long as you're starting from scratch. It's not quite so easy if you already have a full site with bunches of content. I _probably_ could have found an easier way to do it, but I ended up building a new repo from the [Chirpy Starter Template](https://github.com/cotes2020/chirpy-starter) then force pushing it to the head of my repo being served by my domain.

There were also some things I had to clear up; for instance, some of my pages weren't working any more because the layout didn't exist, so I had to build up those layouts. That mostly affected the layout serving panoramas (e.g. my [ Disney Cruise panoramas]((% post_url 2014-10-01-disney-cruise-panoramas.md %})). That also took a migration to a different panorama vendor which I may talk about later but at the end it worked out.

![Search results](panorama.png){: lqip="panorama.lqip.jpg" }

Another bug I had to patch was the search functionality; it didn't do full-text searching out of the box, so I played with it until it was able to; I was really excited to get the search working properly as I haven't had that on my site before. I may add some detail as to how I got this to work in a future post

![Search results](search.png){: lqip="search.lqip.jpg" }

Any rate, as you can see, the new look is up and IMO it looks great. Here's to the next ~8 years before a redesign!

Cheers!