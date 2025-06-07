---
title: Adding Some Disk Space
date: 2015-05-07
category: Thoughts
tags: 
- raid
- backup
- crashplan
- external hard drive
---

I'm sure we all have one of those "there is NO WAY I could possibly use that much hard disk space" moments, and I'm sure
that for each one of those moments, we all have a matching one where we say "wait... what? 95% full???" Personally, I'm
still reeling that I purchased a microSD card for my phone which has several orders of magnitude more storage than my 
first "there is NO WAY" moment with a 1.44MB 3.5" floppy.
 
Side note; I HAD TO do the math. One 3.5" floppy is 90mm x 93.7mm x 3.3mm. One microSD card is 15mm x 11mm x 1mm. So,
physically, in the space of one floppy, I can fit 146 microSD cards; probably even more if I get clever with the
arrangements. However, the storage space in the ONE 64GB microSD card I have would take a stack of floppies 143m (473ft)
tall, taller than the Great Pyramid, taller than the Statue of Liberty... you get the idea. If I instead made something
more manageable, it would make a cube-ish volume about 1m on each side (1.18m x .99m x 1.02m), 11 disks wide, 11 disks
long, and 358 disks tall.

That's a lot of storage, is what I'm saying.

![like this](/assets/img/posts/adding-some-disk-space/raid_change_warehouse.jpg)

Pictured: the microSD card in my phone
{: .caption}

Except it's really not. I can fill the card with just the music I have. Or with just the pictures I have. Not both, mind
you; if I put all of either on it, there would be hardly any room left. So, in order to store all that plus my documents
plus my videos (I've been backing up the DVDs I have, and that takes ROOM), I have to have a bunch of storage. I used to
be happy with my 120GB drive just a handful of years ago. Now, I have a 1TB drive I LITERALLY forgot I even owned.

Unfortunately, when you have this much stuff stored, manging it and protecting it becomes difficult. Hell, I practically
lost all of it when migrating computers (perhaps I'll write another post about that; I shared the ongoing saga on
Facebook), and that was after (and because) I'd set some stuff up for data redundancy so I could protect it more. One of
the biggest problems is "what do I do if I need to move large chunks of data around?". This is kinda where I'm at now.

I need to add more storage because my 2x2TB RAID 1 (meaning it's 2 drives with 2TB each, but the drives are cloned so if
one fails, the other is still operational until I get a replacement; if a drive fails, I don't lose everything) is just
about full. I've got a couple 1TB drives around, but that's just not enough. I have my photos and my music backed up
offsite already through Dropbox, but I don't have enough room for my videos, which takes the lion's share of the space.
Also, I'm looking to pull most of my DVDs onto the server so I don't have the disks around, so that's another 3-5GB for
each of ~160 disks. So, it's time to add storage.

First off, I got [CrashPlan](https://www.code42.com/crashplan/) for backups. Having almost lost all my videos and music and everything (and then
finding it all again on that 1TB drive I forgot about!), I want to avoid this happening again. Fortunately, a subscription
to CrashPlan is reasonably priced (cheaper than Amazon's backup service and cheaper than Dropbox) and it's unlimited in
size (unlike Dropbox). The downside is that it takes a LONG time to upload 1.8TB of data (I'm currently at 30% with 23
days left). I also got a 4TB external hard drive to augment the cloud backups. This way, I have a local copy as well as
the offsite; local copy is better for problems where, say, my house DIDN'T burn down taking everything with it. This
backup is faster, but it's still ~30 hours for the full transfer of data.

Now that I have the backups, I can do the next step: growing my RAID. As I mentioned, I'm using RAID 1 which is drive
mirroring. Unfortunately, there's no way for me to grow with RAID 1. I can't just add another drive and make it larger;
I'd have to get two new drives and create a new RAID array. Therefore, to add 2TB to my existing 2TB, I would have to
get two 2TB drives and create a separate RAID drive. Not ideal because then I'd have to shard my contents (some on array
1, some on array 2) and expensive because it's buying two drives. I'd also have to find a place to put them, a way to
power them, etc.

BUT!

I can grow my RAID 1 to a RAID 5. RAID 5 is interesting because it has two data partitions and one parity partition, all
of which works together to provide double the size of a single data partition. Weird? Yes. Let me explain.

Say I have three disks in a RAID 5. The RAID logic stores some data in disk 1, some data on disk 2. Then, while the
storage is happening, a difference between disk 1 and disk 2 is being calculated. This difference is stored on disk 3.
The idea is that, should any one of the three drives fail, all the data of that failed drive can be recalculated from
the other two. The parity or difference on disk 3 can be used to compare with the data on disk 1 to calculate
what is on disk 2 and vice versa. Perhaps I'll do a separate post on how exactly it's managing to do this; it reallly is
a clever concept.

Applied to my situation, what I'm planning on doing is using ```mdadm``` to break the existing RAID, add a new 2TB drive,
make a new RAID format, grow to include the new drive, and rebuild the new array. I've seen reports that this can be
done without even taking the storage offline, but I don't think I'll be going that crazy. End result? 4TB of storage in
an array which can withstand drive failure, doubly backed up onsite and offsite, with at least 2 (3?) 1TB drives floating
around for other things.

Any rate, I'm going to start on this as soon as the backup to my 4TB drive is done, which seems like it's going to be
tonight. Wish me luck!

