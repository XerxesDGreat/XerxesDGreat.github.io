---
title: Adding Some Disk Space, part 4
date: 2015-05-14
category: Thoughts
tags: 
- raid
- backup
- crashplan
- external hard drive
---
 
In the last installment, I brought up the fact that I was trying to save time because one operation was going to take a
couple thousand minutes to complete. Let me describe to you what I did.

Based on my original experience with RAID (albeit, with RAID 1), it didn't take too long to complete, and I could use
the file system while it completed. One of the complaints I had in the last post was that I wouldn't be able to use the
file system while it was resizing; I didn't know that until I went down this path. So, I was working on assumptions and
impatience. Probably not the best way to approach projects, but I had a backup; I wasn't too concerned with data loss. I
just wanted to be back up and running!

Alright, so the idea is that I'll just tear down the RAID and rebuild it from scratch and then restore the backup. The
backup took about 16 hours, so I figured restoration will take about that long. All I have to do is make the RAID
operation less than 26 hours and I'll be ahead. I can do that! I started by breaking the array and re-initializing the
disks

    $ sudo mdadm --stop /dev/md0
    [sudo] password for josh:
    mdadm: stopped /dev/md0
    
    $ sudo mdadm --zero-superblock /dev/sda1
    
    $ sudo mdadm --zero-superblock /dev/sdb1
    
    $ sudo mdadm --zero-superblock /dev/sdd1

Then did an fdisk on each of them. I decided to create a partition that was a couple hundred MB smaller than the drive
size so I could ensure I'd be able to replace the disk in case of failure.

Side note: the benefit of RAID is that I can easily replace a disk to restore drive failures. I can base the RAID on
either the full drive, or on a partition contained within the drive. The former is a little easier to manage because
partitioning is unnecessary. However, the huge downfall is if I can't get a drive that's exactly the same size, I can't
fix the array in case of failure. So, I'll create a partition because I have control over how much room is allocated;
even if the new drive is a little smaller (but still nominally the same size), I'll be able to match the size.

Back to the story. Nothing novel here, just used ```fdisk``` to delete the old partition and recreate a slightly smaller
partition on each of the disks. I read a bit and found that there's a format which is specifically for RAID and Linux;
in ```fdisk``` it's called something like "Linux RAID auto". So I used that format for the partitions.

Now that I have all the partitions, I recreated the array

    $ sudo mdadm --create --bitmap=internal --metadata=1.2 --level=5 --raid-devices=3 /dev/md0 /dev/sda1 /dev/sdb1 /dev/sdd1
    [sudo] password for josh:
    mdadm: /dev/sda1 appears to contain an ext2fs file system
        size=1953513472K  mtime=Fri Dec 26 14:31:20 2014
    Continue creating array? y
    mdadm: array /dev/md0 started.
    
    $ cat /proc/mdstat
    Personalities : [linear] [multipath] [raid0] [raid1] [raid6] [raid5] [raid4] [raid10]
    md0 : active raid5 sdd1[3] sdb1[1] sda1[0]
          3906763776 blocks super 1.2 level 5, 512k chunk, algorithm 2 [3/2] [UU_]
          [>....................]  recovery =  2.2% (43053836/1953381888) finish=728.0min speed=43728K/sec
          bitmap: 0/15 pages [0KB], 65536KB chunk
    
And now, we wait.

24 hours later...

Yeah, so 728 minutes is far less than 24 hours. One thing I didn't account for in my calculations is that it wasn't like
I was going to be available to start the backup recovery immediately after the array was created, so there was
inefficiency there. Oh well, I still have a couple hours leeway. So, I go to mount the drive, and I get failures. Great.
So, I do what any sensible person would do: I panic and start over again. The whole RAID process, only this time, I use
the Linux ext4 format for the partitions as I'm POSITIVE that this is what failed for me. So, back to ```fdisk``` and
 ```mdadm``` and another 24 hours....
 
And now, the first way would have been done, and I'm not there yet. It's now 24 hours after the second re-RAIDing, so I'm
ready to mount it. Failures. Great. I then realize the problem: I didn't create a file system on the drive. Man, if that's
it, I didn't have to re-reRAID.

    $ sudo mkfs.ext4
    
Wow. I feel dumb. Any rate, now I have a much larger drive!

    $ sudo fdisk -l
    ...
    
    Disk /dev/md0: 4000.1 GB, 4000106676224 bytes
    2 heads, 4 sectors/track, 976588544 cylinders, total 7812708352 sectors
    Units = sectors of 1 * 512 = 512 bytes
    Sector size (logical/physical): 512 bytes / 4096 bytes
    I/O size (minimum/optimal): 524288 bytes / 1048576 bytes
    Disk identifier: 0x00000000
    
    ...
    
So, time to restore the backup. After restarting CrashPlan and triggering the restore, it looks like it'll take ~12 hours.
And, sure enough, after about 14 hours, I take a look at used space:

    $ df /dev/md0 -h
    Filesystem      Size  Used Avail Use% Mounted on
    /dev/md0        3.6T  1.5T  2.0T  42% /mnt/raid1
    
So, I started this whole process to add ~2TB of drive space... and several days later, I've got 2TB more. Woohoo!

Any rate, I learned a few things about how RAID works, more stuff about how file systems work, the structures of new
hard drives, and to always check my work! Certainly, this has been informative and that's good... because I'll probably
have to do something like this again in about a year. Or sooner, if I ever finish working on my LEGO DVD ripping robot...
    
    
