---
title: Time Lapse LEGO Assembly, The Tumbler
date: 2015-03-29
category: Projects
tags: 
- lego
- timelapse
- video
---

Okay, so I'm supposed to wait till Tuesday to release this post... but I don't want to wait. I think this is damn cool,
and I'm gonna share it with you NOW! I made a timelapse of assembling The Tumbler!

![The Tumbler](/assets/img/posts/time-lapse-lego-assembly-the-tumbler/tumbler.jpg)

As you may know, I really like Batman. I mean, I'm not a fanatic or anything, but I've seen all the recent live-action
movies, played the recent video games, etc. I liked the first two iterations of the Tim Burton reboot of Batman, the ones
with Michael Keaton, and bought the model of [The Batmobile](http://brickset.com/sets/7784-1/The-Batmobile-Ultimate-Collectors-Edition) when that came out. At the time, it was one of the bigger
sets that I'd put together. Come to think of it, it still is one of the larger sets I have!

![The Batmobile](/assets/img/posts/time-lapse-lego-assembly-the-tumbler/tim_burton_batmobile.jpg)

However, when The Tumbler (a.k.a the Batmobile from the Christopher Nolan Dark Knight Trilogy) came out, I just HAD to
have it! It's a pretty awesome vehicle and really just screams "Batman", so I saved up for that as well. A piece of
trivia; there are real-world examples of both the Tim Burton Batmobile and the Tumbler; they were used in filming and
are still around. For some reason, I think Jay Leno has at least one of them, but then, he's such a car nut, he probably
has one of every rare car out there!

![Both Batmobiles](/assets/img/posts/time-lapse-lego-assembly-the-tumbler/both_batmobiles.jpg)

Any rate, I created a timelapse of putting together The Tumbler in much the same way I did [the Detective's Office]({{ site.baseurl }}{% link _posts/2015-03-26-time-lapse-lego-assembly-detectives-office.md %})
with two major exceptions: instead of using the ```mogrify``` command, I decided to try and use Python's [Pillow (a
fork of PIL)](http://pillow.readthedocs.org/) to resize images. Once I'd installed it, I ran a script (included toward the bottom, in case you're
interested) to resize into 720p and 1080p (for testing video sizes); resizing to BOTH image sizes was about 6x faster
using python than when using ```mogrify```. Side note: after doing the size testing, I found that the 720p raw video
was 151MB while the 1080p was 266MB; not quite as much savings as I calculated, but still much better for uploading to
YouTube!

The other major exception was that I used [OpenShot](http://www.openshot.org/), an open-source video editor to combine the stills, the
video, the audio, and get it all lined up right. I'm not thrilled with the software, but it's free and open source, so
if I have that much of a problem, I can go and modify it. Also it got the job done, so who am I to complain?

Well, talky over, here's the video:

{% include embed/youtube.html id='_cnNA6lmflg' %}

And, for those interested, the script I used to resize. It obviously has references to my directories, but there we go.

    :::python
    import os
    from PIL import Image
    
    content_dir = os.path.realpath(os.getcwd())
    ns = 'e'
    src = os.path.join(content_dir, '20150328_tumbler6')
    dest = os.path.join(content_dir, 'tumbler_resized')
    sizes = (
        ((1920,1080),'1080p'),
        ((1280,720),'720p')
    )
    
    print 'copying files from %s to %s' % (src, dest)
    
    for root, dirs, files in os.walk(src):
        for f in files:
            base, ext = os.path.splitext(os.path.basename(f))
            target_f = '.'.join([ns + base.lower(), 'jpg'])
            im = Image.open(os.path.join(root, f))
            for s in sizes:
                realdest = os.path.join(dest, s[1])
                if os.path.isfile(os.path.join(realdest, target_f)):
                    print 'file %s exists; chickening out' % f
                    continue
                im.thumbnail(s[0], Image.ANTIALIAS)
                im.save(os.path.join(realdest, target_f))
            print 'thumbnail created for %s; image %s saved' % (f, target_f)
            

