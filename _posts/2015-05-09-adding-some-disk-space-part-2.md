---
title: Adding Some Disk Space, part 2
date: 2015-05-09
category: Thoughts
tags: 
- raid
- backup
- crashplan
- external hard drive
---

So, I didn't get started with this on Thursday. In fact, it wasn't till Saturday that I decided to actually take the
plunge. And now I'm stuck in the middle of it, waiting for... a long time. Since I'm stuck, I'll tell you what I'm doing.
Hell, maybe later I can just look this up and see what I did if I ever need to do it again!

First off, I made sure my data was backed up. The backup to my external hard drive is complete, but not to online; that
will still take a couple weeks, and I'm pretty sure my ISP is slowing me down due to the quantity of data. Nothing I can
do about that, and I really don't feel like waiting for the online one to complete (or not if Comcast is a jerk), so
moving right along.

Next, install the drive. Currently, I have 4 hard disks in my computer: 2 in the RAID, 1 for OS, and one for additional,
non-critical storage. Fortunately, I have more room for expansion:

![more room](/assets/img/posts/adding-some-disk-space-part-2/upgrade-raid-2-internal.jpg)

This part is easy. Turn off the comp, install the drive physically, turn it back on. We're not going to worry about
mounting or formatting the drive at this time; we'll take care of that later.

Now, let's see what drives we have installed:

    $ ls . | grep sd
    sda
    sda1
    sdb
    sdb1
    sdc
    sdc1
    sdc4
    sdc5
    sdd
    sde
    sde1
    sdf
    sdf1
    sdg
    sdh
    sdi
    sdj
    
    $ for i in a b c d e f
    do
    sudo blkid /dev/sd${i}1
    done
    /dev/sda1: UUID="b40ddd3b-99d4-3315-12a3-5b049823d64f" UUID_SUB="98c34145-47b7-f48c-2222-0bc22e705ace" LABEL="Scrapbook-Ubunut:0" TYPE="linux_raid_member" 
    /dev/sdb1: UUID="b40ddd3b-99d4-3315-12a3-5b049823d64f" UUID_SUB="a1047336-b1a1-9de5-9402-d1a4f8cb8073" LABEL="Scrapbook-Ubunut:0" TYPE="linux_raid_member" 
    /dev/sdc1: UUID="4850-5BDF" TYPE="vfat" 
    /dev/sde1: LABEL="HOTSTORE" UUID="7c2f27a8-aa72-4e73-97cb-740967cfeba5" TYPE="ext4" 
    /dev/sdf1: LABEL="Seagate Backup Plus Drive" UUID="B06260E36260AFB0" TYPE="ntfs"

Looks like ```/dev/sdd``` is the new drive; it's not being used, it doesn't have a partition, and the old drives are
accounted for in ```/dev/sd[a,b,c,e,f]```. Let's investigate a bit further.

    $ sudo hdparm -I /dev/sdd
    
    /dev/sdd:
    
    ATA device, with non-removable media
        Model Number:       WDC WD20EZRX-00D8PB0                    
        Serial Number:      WD-WCC4M2ZS3CVK
        Firmware Revision:  80.00A80
        ...
        device size with M = 1024*1024:     1907729 MBytes
        device size with M = 1000*1000:     2000398 MBytes (2000 GB)

Okay, so that's the new drive: a Western Digital WD20-EZRX, 2TB. Now, my old drives are a different model:

    $ sudo hdparm -I /dev/sda
    
    /dev/sda:
    
    ATA device, with non-removable media
        Model Number:       WDC WD20EARS-00MVWB0                    
        Serial Number:      WD-WCAZA6073715

Old is the EARS, new is the EZRX. Now, they're both 2 TB drives, both are Western Digital Green, and I'm sure I looked
at this when I ordered the drive, but I've forgotten now, and am concerned. I'm going to make sure they're all the same
size; that's the biggest concern I have

    $ for c in a b d                   
    for> do
    for> sudo blockdev --getsize64 /dev/sd${c}
    for> done
    2000398934016
    2000398934016
    2000398934016

Whew, they are. I'll just move forward from here then.

Now we're getting into crazy talk time. We have to stop the array, recreate it as a level 5 array, let it recover, grow
it by adding the new disk to it, and then let it recover again. This is where my palms get sweaty, evn though I have the
backups. But, might as well just rip the Band-Aid off!

    $ sudo mdadm --stop /dev/md0
    mdadm: Cannot get exclusive access to /dev/md0:Perhaps a running process, mounted filesystem or active volume group?

What? Well, that was anticlimactic. Let's see what's going on. Something must be using it; I do have a bunch of links to
the mount point.

    $ sudo lsof | grep raid
    lsof: WARNING: can't stat() fuse.gvfsd-fuse file system /run/user/1000/gvfs
          Output information may be incomplete.
    raid5wq     164                     root  cwd       DIR               8,36        4096          2 /
    raid5wq     164                     root  rtd       DIR               8,36        4096          2 /
    raid5wq     164                     root  txt   unknown                                           /proc/164/exe
    md0_raid1   200                     root  cwd       DIR               8,36        4096          2 /
    md0_raid1   200                     root  rtd       DIR               8,36        4096          2 /
    md0_raid1   200                     root  txt   unknown                                           /proc/200/exe
    java       1543                     root   78r      REG                9,0 23640825336   85852162 /mnt/raid1/Videos/movies/Seven Pounds (2008).mkv
    java       1543 1566                root   78r      REG                9,0 23640825336   85852162 /mnt/raid1/Videos/movies/Seven Pounds (2008).mkv
    java       1543 1567                root   78r      REG                9,0 23640825336   85852162 /mnt/raid1/Videos/movies/Seven Pounds (2008).mkv

This is trimmed for brevity's sake; there were about 30 processes working on ```Seven Pounds (2008).mkv```, plus a couple
others. I didn't grab it in the above, but two were ```smbd``` processes; I remembered that I have a couple directories
mounted on my HTPC in the other room. I closed those, still have this open. Hmmm. My media server uses that directory...

    $ sudo service plexmediaserver stop
    plexmediaserver stop/waiting

Okay, run ```lsof``` again; still no dice. What on earth could be using this?

Oh.

Remember that backup that won't complete for 16 days? I didn't.

    $ sudo ./CrashPlanEngine stop
    [sudo] password for josh: 
    Stopping CrashPlan Engine ... OK

Okay, NOW ```lsof``` gives me a clean bill of health. Let me just stop the array...

    $ sudo mdadm --stop /dev/md0
    mdadm: Cannot get exclusive access to /dev/md0:Perhaps a running process, mounted filesystem or active volume group?

Kids, if you're trying this at home, please remember to unmount the array.

    $ sudo umount raid1

    $ sudo mdadm --stop /dev/md0
    mdadm: stopped /dev/md0
    
Whee! I get a few warnings here and there (Dropbox complained, other things did weird stuff) but the system is still up
and running. So now that it's stopped it's time for me to create the new RAID setup

    $ sudo mdadm --create /dev/md0 --level=5 --raid-devices=2 /dev/sda1 /dev/sdb1
    mdadm: /dev/sda1 appears to contain an ext2fs file system
        size=1953513472K  mtime=Fri Dec 26 14:31:20 2014
    mdadm: /dev/sda1 appears to be part of a raid array:
        level=raid1 devices=2 ctime=Fri Dec 26 14:44:59 2014
    mdadm: /dev/sdb1 appears to be part of a raid array:
        level=raid1 devices=2 ctime=Fri Dec 26 14:44:59 2014
    Continue creating array? y
    mdadm: Defaulting to version 1.2 metadata
    mdadm: array /dev/md0 started.

Okay, so now there is a level-5 array being created on my old two disks; purportedly, they will be getting everything all
set up to have a fully-functional 2 disk array. I hope that happens; something I didn't consider until RIGHT NOW is that,
if my disks are close to full (which they are), I'm not sure there'll be enough room to create a level-5 array. This is
because a level-5 RAID gives two-thirds of the available space for storage. HOwever, I don't know what kind of magic it
will be doing in the background; level 5 theoretically requires 3 drives and I'm doing it on 2.

Any rate, let's check the progress. It's been running for ... 30 minutes or so?

    $ cat /proc/mdstat
    Personalities : [linear] [multipath] [raid0] [raid1] [raid6] [raid5] [raid4] [raid10] 
    md0 : active raid5 sdb1[2] sda1[0]
          1953381888 blocks super 1.2 level 5, 512k chunk, algorithm 2 [2/1] [U_]
          [>....................]  recovery =  4.9% (96219168/1953381888) finish=688.2min speed=44970K/sec
          
    unused devices: <none>
    
Ah. Finishing in 688.2 min. That's a long time. I'll just put this in a terminal with a ```watch``` command; that way, if
something should change, I'll be able to see it (```watch``` does a command every 2 seconds; it's great for seeing the
progress of things which don't have fancy progress bars)

    $ watch cat /proc/mdstat
    
And so, now I'm writing this, and have to wait 11 hours for this to complete. I guess I'll update you on the state on
Tuesday!

