---
title: Adding Some Disk Space, part 3
date: 2015-05-12
category: Thoughts
tags: 
- raid
- backup
- crashplan
- external hard drive
---

Let's see, where did I leave off in [the last installment]({{ site.baseurl }}{% link _posts/2015-05-09-adding-some-disk-space-part-2.md %})? Oh yeah, setting up the level 5 array with just the
two disks; this is before adding the third and growing it. We had just started the new array and it was
resizing/repairing/whatever. Weeeellll... a lot has happened since then. Let's go through it.

    $ cat /proc/mdstat      
    Personalities : [linear] [multipath] [raid0] [raid1] [raid6] [raid5] [raid4] [raid10] 
    md0 : active raid5 sdb1[2] sda1[0]
          1953381888 blocks super 1.2 level 5, 512k chunk, algorithm 2 [2/2] [UU]
          
    unused devices: <none>

This is what is seen when the array is fully synced (sunk?) Getting a little more detail, we see this:

    $ sudo mdadm --detail /dev/md0
    /dev/md0:
            Version : 1.2
      Creation Time : Sat May  9 13:47:56 2015
         Raid Level : raid5
         Array Size : 1953381888 (1862.89 GiB 2000.26 GB)
      Used Dev Size : 1953381888 (1862.89 GiB 2000.26 GB)
       Raid Devices : 2
      Total Devices : 2
        Persistence : Superblock is persistent
    
        Update Time : Sun May 10 02:02:46 2015
              State : clean 
     Active Devices : 2
    Working Devices : 2
     Failed Devices : 0
      Spare Devices : 0
    
             Layout : left-symmetric
         Chunk Size : 512K
    
               Name : Scrapbook-Ubunut:0  (local to host Scrapbook-Ubunut)
               UUID : ea9b562c:f4b8d79d:66e5ff49:0e93fcc3
             Events : 149
    
        Number   Major   Minor   RaidDevice State
           0       8        1        0      active sync   /dev/sda1
           2       8       17        1      active sync   /dev/sdb1
           
Yup, two disks, as imagined. So now, we need to add the third disk. First, I looked for it to be sure it's in the right
place:

    $ sudo fdisk -l
    
    ...
    Disk /dev/sdd: 2000.4 GB, 2000398934016 bytes
    255 heads, 63 sectors/track, 243201 cylinders, total 3907029168 sectors
    Units = sectors of 1 * 512 = 512 bytes
    Sector size (logical/physical): 512 bytes / 4096 bytes
    I/O size (minimum/optimal): 4096 bytes / 4096 bytes
    Disk identifier: 0x00000000
    
    Disk /dev/sdd doesn't contain a valid partition table
    
    ...
    
Yup, that's the one: ```/dev/sdd```. Now I'm going to go ahead and use ```fdisk``` to create a new partition so we can
add it to the array above

    $ sudo fdisk /dev/sdd
    Device contains neither a valid DOS partition table, nor Sun, SGI or OSF disklabel
    Building a new DOS disklabel with disk identifier 0x5af1d0fe.
    Changes will remain in memory only, until you decide to write them.
    After that, of course, the previous content won't be recoverable.
    
    Warning: invalid flag 0x0000 of partition table 4 will be corrected by w(rite)
    
    The device presents a logical sector size that is smaller than
    the physical sector size. Aligning to a physical sector (or optimal
    I/O) size boundary is recommended, or performance may be impacted.
    
    Command (m for help): n
    Partition type:
       p   primary (0 primary, 0 extended, 4 free)
       e   extended
    Select (default p): p
    Partition number (1-4, default 1): 
    Using default value 1
    First sector (2048-3907029167, default 2048): 
    Using default value 2048
    Last sector, +sectors or +size{K,M,G} (2048-3907029167, default 3907029167): 
    Using default value 3907029167
    
    Command (m for help): w
    The partition table has been altered!
    
    Calling ioctl() to re-read partition table.
    Syncing disks.

Just using the defaults here, nothing fancy. This will create a partition taking up the full size of the disk and of
file system type ext4 (Linux default). Now, another call to ```fdisk -l``` will confirm that the changes are there

    $ sudo fdisk -l
    
    ...
    Disk /dev/sdd: 2000.4 GB, 2000398934016 bytes
    81 heads, 63 sectors/track, 765633 cylinders, total 3907029168 sectors
    Units = sectors of 1 * 512 = 512 bytes
    Sector size (logical/physical): 512 bytes / 4096 bytes
    I/O size (minimum/optimal): 4096 bytes / 4096 bytes
    Disk identifier: 0x5af1d0fe
    
       Device Boot      Start         End      Blocks   Id  System
    /dev/sdd1            2048  3907029167  1953513560   83  Linux
    ...

Time to add ```/dev/sdd1``` to the array

    $ sudo mdadm --add /dev/md0 /dev/sdd1
    mdadm: added /dev/sdd1
    
    $ sudo mdadm --grow /dev/md0 --raid-devices=3
    mdadm: Need to backup 1024K of critical section..

I looked up that error; it's nothing, just something informative. So now, I look at mdadm to make sure that everything
is as it should be (warnings always make me scared)

    $ sudo mdadm --detail /dev/md0
    /dev/md0:
            Version : 1.2
      Creation Time : Sat May  9 13:47:56 2015
         Raid Level : raid5
         Array Size : 1953381888 (1862.89 GiB 2000.26 GB)
      Used Dev Size : 1953381888 (1862.89 GiB 2000.26 GB)
       Raid Devices : 3
      Total Devices : 3
        Persistence : Superblock is persistent
    
        Update Time : Sun May 10 10:48:55 2015
              State : clean, reshaping 
     Active Devices : 3
    Working Devices : 3
     Failed Devices : 0
      Spare Devices : 0
    
             Layout : left-symmetric
         Chunk Size : 512K
    
     Reshape Status : 0% complete
      Delta Devices : 1, (2->3)
    
               Name : Scrapbook-Ubunut:0  (local to host Scrapbook-Ubunut)
               UUID : ea9b562c:f4b8d79d:66e5ff49:0e93fcc3
             Events : 176
    
        Number   Major   Minor   RaidDevice State
           0       8        1        0      active sync   /dev/sda1
           2       8       17        1      active sync   /dev/sdb1
           3       8       49        2      active sync   /dev/sdd1
           
Great, it's "clean, reshaping", so it's doing what I expect. Let's check ```mdstat``` to see how long this is going to
take

    $ cat /proc/mdstat
    Personalities : [linear] [multipath] [raid0] [raid1] [raid6] [raid5] [raid4] [raid10] 
    md0 : active raid5 sdd1[3] sdb1[2] sda1[0]
          1953381888 blocks super 1.2 level 5, 512k chunk, algorithm 2 [3/3] [UUU]
          [>....................]  reshape =  0.1% (3368448/1953381888) finish=2365.0min speed=13741K/sec
          
    unused devices: <none>

Hmmm, 2365 minutes. That's... hmmm, carry the 1... be sure to add the decimal point.... WAY TOO GODDAMN LONG! To be clear,
everything thus far has been working swimmingly; I have no reason to believe this is a bad thing. It's just... So part of
the problem is that, unlike a mirrored drive, a level 5 RAID setup is not able to be used while the rebuilding is
happening due to the way everything works. Once this operation is done... fine. But I have things I need to do with my
computer, so I have to find a way to speed this process up. And I found one!

And thus, the next episode is going to be all about how I spent potentially way more time executing the "faster" way of
doing this.

