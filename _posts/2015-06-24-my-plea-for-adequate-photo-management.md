---
title: My Plea for Adequate Photo Management
date: 2015-06-24
category: Projects
tags: 
- photo
- google photos
- dropbox
- crashplan
- organization
- ifttt
---

If there's one thing which you'd think computers and software had solved by now, it's photos. There are so many
different ways to organize, share, and safekeep photos out there that you'd think one would get it right. Failing that,
perhaps it would be easy or simple or pretty straightforward to use a combination of two or more of these products to
meet all your needs. Alas, I have been unable to find one.

![brown ugly couch](/assets/img/posts/my-plea-for-adequate-photo-management/photo_nightmare_couch.jpg)
I *did* find $1.77 and a VTA token in the couch, though
{: .caption}

So far, I've gone through Picasa (now pretty much defunct), Lightroom, Dropbox, iPhoto, and Google Drive and none of
them have delivered what I want. I built my own web app for photo management, but I lacked the know-how to make it do
everything I want. Most recently, I installed the brand-new Google Photos; hell, I was hoping that this would solve my
problems soooo hard that I was installing it while watching Google I/O live as they were announcing it, and it failed
a few core pieces of the photo management infrastructure I'm looking for.

Therefore, I'm going to describe the PERFECT photo application (from my perspective, of course). Maybe by telling
you about the problem I can [rubber duck](https://en.wikipedia.org/wiki/Rubber_duck_debugging) my way into a system which will do what I want. Then again,
perhaps I won't find a solution, but one of my enterprising friends will build a system based on my specs for me (note:
I'll pay GOOD money for something which meets all my requirements). 

![shut up and take my money](/assets/img/posts/my-plea-for-adequate-photo-management/photo_nightmare_shut_up.jpg)

###Organization and Storage
*   **Secure**: Buzzwordy, but true. Gotta have relatively decent security, if for no other reason than so someone can't
    just go and delete all your photos.
    
*   **Have automatic backup**: Ideally to the cloud, immediately. Would be good to have other options built in.

*   **Syncing between devices**: See cloud backups; if you have that, then it's easy(ish; I'm fully aware of the very
    real difficulties which are inherent in allowing management of common resources with more than one access point, but
    there are many services which provide this already, so I don't think I'm asking for too much).

*   **Ability to categorize photos**: The two main things going on in photos are "albums" and "tags". Frankly, I think
    that the difference between these is syntactic and purely technical, so I'll call them "tags" because it has fewer
    letters than "albums" or "categories" or "groups". As for how they work, let me describe what I want: I'd like to
    group pictures which have things in common, regardless of what that thing is: "Yosemite trip, 2015", "Cora", and
    "blue" are all valid categorizations. I should be able to add multiple tags to any given photo and many photos
    should be able to share the same tag. I should be able to take actions on multiple photos/videos based on these tags
    (i.e. "share all photos with a tag of 'Yosemite trip, 2015' to Facebook")

*   **Support for arbitrary folder structures**: I don't feel so strongly about this one if I'm just starting a photo
    collection. However, I'm *not* just starting a photo collection; I've got dozens of GB of photos in a directory
    structure which meets my needs and I don't want to change it just cuz.

###Management and Access
*   **Web-based access**: This one is debatable... sorta. I'd like to be able to just open up a browser, point to a
    url, and be able to flip through my photos. I feel really strongly about this one, but the number of times I'll
    actually do this is admittedly shrinking

*   **iOS and Android App**: Technically, I only require an Android app, but I don't want to be limited by that if I
    choose to go back to iOS. Not likely, but still...

*   **Cross-platform Desktop App**: I use Linux and Mac and Windows and Shanin uses Mac, so cross-platform is a huge win.
    Just write it in Java; if it works for Minecraft, it should work for photos! But why do I want a desktop app at all,
    you may ask? Because I don't want to *have* to be online to manage my photos. In a world where I commute on the
    train, I'd have to use data to access the web app, and I don't like that requirement.
     
*   **Multiple Users**: This is perhaps the biggest sticking point with every photo-management software I've tried.
    Shanin and I store our pictures together, so it makes sense that we'd want to manage our pictures together. No, I
    don't want to have a "both of us" account; I want us both to be able to access the same photos from our respective
    apps and have the same albums, tags, edits, etc. That way, when I add pictures from my camera and she adds pictures
    from her camera, they are all backed up and available in order to put together better albums, groupings, etc. Plus,
    if she deletes pictures because they suck, they're removed from my view also.

###Editing
*   **Red-Eye Reduction**: I don't care how it's done. I want to be able to get rid of red eyes or other blemishes.
    A really good one-click solution would be best, but that's less likely without proprietary software. As long as
    there is a way, I'll be happy

*   **Protect the Original**: Just make a copy of the original and apply the edits to it. It would be good if there were
    some unobtrusive way to tell whether a picture has been edited so I'd know I could get the original if desired.
    
*   **Lock Pictures Currently Being Edited**: If all users of the collection are able to edit pictures, then we need to
    make sure two people aren't editing the same photo; therefore, perhaps some locking mechanism ("This photo is
    currently in use" or something)
    
*   **Don't Recreate Photoshop**: Just... don't. Rotate by arbitrary degrees, white balance, exposure, saturation, etc.
    Maybe some auto filters like sepia, black and white, etc. But really, we're not looking for hugely complex here.

###Misc
*   **Share Directly To Social Networking**: We need the ability to share a photo or group of photos to, say, Facebook.
    It'd be great if it did an upload to FB, but linking to the aforementioned web app is probably fine.
    
##So... What Next?
Well, as you can see, I kinda know exactly what I want. Trouble is, there isn't anything I can tell which will truly do
all of these. Let's look at what we have available.

###[Dropbox](https://www.dropbox.com)
For most of the storage, Dropbox will do. However, that's ALL it does; just file storage. I can share with
many users, have it on all my devices, auto backup, etc. So, let's build on that. Or at least try to.

###[Picasa](https://picasa.google.com)
Doesn't have support for multiple users... or even multiple machines, really. The 
edits and categorizations were stored in such a way that you *could* possibly share that state using Dropbox, but it's
shaky at best. Plus, no support for Linux.

###[Photos for Mac](https://www.apple.com/mac/iphoto/), previously known as iPhoto
Well, the fact that it's "for Mac" should tip you off, but it also has an... "interesting" UX, an odd data structure,
and single-user issues.

###[Google Photos](https://photos.google.com)
Tied directly to your Google account and absolutely no flexibility when it comes to the storage. You *can* use Google
Drive to keep things synced on your desktop, but it's not very straightforward. Plus, no Linux support. In fact, no
desktop apps at all. But the main issue is the single user thing.

###[Lightroom](https://lightroom.adobe.com)
Costs money. Not a huge issue, but $10/month is $10/month. Plus, it's a MASSIVE app. For $10/mo, you get Photoshop and
Lightroom and more, so I mean, it's not a bad deal. But, considering they (once again) don't run on Linux... Plus, it's
much more professional photographer organization and storage. Plus, no mobile apps.

So now we're back to square one. I'm using a combination of Google Drive, Google Photos, and Dropbox, but due to my set
up, I have all my photos in Dropbox as they have been, a VM running Windows, the Google Photos uploader listening for
changes to those directories (shared from Linux) to upload new things I put in, and Google Drive syncing the photos back
to another shared directory. The problem is that the Google Photos uploader is only one way. If I take a picture on my
phone, it automatically goes to my Google Photos, but it doesn't get to my computer. Therefore, I have the Google Drive
sync pulling stuff which is added to Google Photos back to my computer.

![ball of hair](/assets/img/posts/my-plea-for-adequate-photo-management/photo_nightmare_hair.jpg)
An approximation of my photo syncing strategy
{: .caption}

One of the main issues I have with this is that ALL of my photos are in one bucket with Google Photos. That's.... fine,
I guess, as long as I can tag them (which I totally can in Google Photos), but it doesn't match my storage strategy
which is in folders by year, then by month, then by day. Therefore, if I move a photo up to Google Photos and pull it
back down again, it ends up NOT in the same storage scheme as the rest of my photos. Again, this is probably fine... in
theory. In reality, if I tell all my photos in Google to go into one bucket in my Dropbox, it'll put *ALL* my
photos on Google into that bucket, which will duplicate all the photos in Dropbox.

So please. If anyone has any recommendations, I'm totally open to hear them. I'm gonna continue plugging away with my
current setup because I spent a long time setting it up and I'm REALLY fond of the Google Photos apps. But then, they
don't have a desktop app, so perhaps I shouldn't. Please help me!
    

