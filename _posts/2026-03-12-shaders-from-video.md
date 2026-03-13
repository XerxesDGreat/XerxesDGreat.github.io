---
title: Shaders From a Video
date: 2026-03-12
# categories are Overview, Show, How-to
category: Light Show
tags:
- shaders
- xlights
- ai
media_subpath: /assets/img/posts/shaders-from-video/
image:
    path: preview.jpg
    lqip: preview.lqip.jpg
---

Had an interesting experience that I wanted to share. I was wrapping up my Christmas
2025 xLights sequences, getting the changes onto git and tagging a release, when the
push started failing. Looking into it, I found it was a single large file that was over
the limit for files in Github, a .avi file for matrix effects in my Rasputin sequence.

![140MB? Really?](file-size.jpg){: lqip="file-size.lqip.jpg" }
_140MB? In this economy?_

My first thought was "I don't even _have_ a matrix, why keep this?" but I figured I'd
watch the video, see if it was worth keeping. The funny thing was that VLC didn't seem
to want to play it; the playlist was there, the timing thing was moving, but no video. Weird.

So I asked Claude why this might be. It led me to a tool to analyze the video to try and
find out what's going on. Luckly, I already had `ffmpeg` installed, so `ffprobe` was there
too...

```
ffprobe version 7.1.1 Copyright (c) 2007-2025 the FFmpeg developers
  built with Apple clang version 17.0.0 (clang-1700.0.13.3)
  configuration: --prefix=/opt/homebrew/Cellar/ffmpeg/7.1.1_3 --enable-shared --enable-pthreads --enable-version3 --cc=clang --host-cflags= --host-ldflags='-Wl,-ld_classic' --enable-ffplay --enable-gnutls --enable-gpl --enable-libaom --enable-libaribb24 --enable-libbluray --enable-libdav1d --enable-libharfbuzz --enable-libjxl --enable-libmp3lame --enable-libopus --enable-librav1e --enable-librist --enable-librubberband --enable-libsnappy --enable-libsrt --enable-libssh --enable-libsvtav1 --enable-libtesseract --enable-libtheora --enable-libvidstab --enable-libvmaf --enable-libvorbis --enable-libvpx --enable-libwebp --enable-libx264 --enable-libx265 --enable-libxml2 --enable-libxvid --enable-lzma --enable-libfontconfig --enable-libfreetype --enable-frei0r --enable-libass --enable-libopencore-amrnb --enable-libopencore-amrwb --enable-libopenjpeg --enable-libspeex --enable-libsoxr --enable-libzmq --enable-libzimg --disable-libjack --disable-indev=jack --enable-videotoolbox --enable-audiotoolbox --enable-neon
  libavutil      59. 39.100 / 59. 39.100
  libavcodec     61. 19.101 / 61. 19.101
  libavformat    61.  7.100 / 61.  7.100
  libavdevice    61.  3.100 / 61.  3.100
  libavfilter    10.  4.100 / 10.  4.100
  libswscale      8.  3.100 /  8.  3.100
  libswresample   5.  3.100 /  5.  3.100
  libpostproc    58.  3.100 / 58.  3.100
[avi @ 0x934c88000] parser not found for codec rawvideo, packets or times may be invalid.
    Last message repeated 1 times
Input #0, avi, from 'Majestic x Boney M - Rasputin Matrix.avi':
  Metadata:
    software        : Lavf58.29.100
  Duration: 00:03:06.20, start: 0.000000, bitrate: 6148 kb/s
  Stream #0:0: Video: rawvideo, 1 reference frame, bgr24, 160x80, 6145 kb/s, 20 fps, 20 tbr, 20 tbn
[AVIOContext @ 0x935038000] Statistics: 223424 bytes read, 4 seeks
```

Lots of output, but the pertinent parts are that it's `rawvideo`, an resolution of
160x80, and at 20fps. With stats like that, _how is it 140MB_? It's because of the
`rawvideo`; basically a bitmap of every frame, 20 frames a second, for 3 min 6 seconds.
This type of video is apparently used to directly drive matrices like those inexpensive
ones people hang over their garages or on their walls these days.

![light curtain](light-curtain.jpg){: lqip="light-curtain.lqip.jpg" }

Now that I knew what it was, I still wanted to see it, so I converted it to a more
human-viewable format. The end result was... well, interesting. It seemed a lot like
a layered set of effects that one could build up with xLights, but the creator of the
video had just captured it all as a video rather than using xLights effects. Fine, maybe
they were going for more uses. A couple snippets from the video:

![preview 0](rasputin_preview.gif)

![preview 1](rasputin_preview_1.gif)

![preview 2](rasputin_preview_2.gif)

All in all, really simple stuff. I mean, this is the kind of thing shaders are built
for, why would they put this into a video.

...

_shaders_....

![asking claude about shaders](claude-convo.jpg)

So, the cut and dry is that I uploaded the compressed video (the raw one was too 
large for upload limits there too) and asked it to analyze the video and come up with
four or so shaders based on the effects which it saw - which were often layered over
each other.

It chewed on that for a while, but eventually spit out four different shaders that, if
I'm honest, did a _not bad_ approximation of some of the effects in the video. Not all
of them, but hey, I didn't tell it to recreate the whole video. Here's all
of the shaders that Claude drew up:

![shader 1](shader_1.gif)

![shader 2](shader_2.gif)

![shader 3](shader_3.gif)

![shader 4](shader_4.gif)

And then combined:

![shader combo](shader_combo.gif)

(note: exporting video from xLights is not easiy, then converting to gif apparently lost
the color that came with, so here's a screenshot proving that this is not just black and
white and wouldn't render as such on the house)

![there's color there I swear it](preview.jpg){: lqip="preview.lqip.jpg" }

But really though? I think that I like these a bit more than what was in the actual
video. They even have a bunch of parameters I can play with to change speed, some
scaling, frequency of color change, etc. Not a bad haul for maybe 30 min talking with
the AI.

Any rate, the cut and dry of this post is _maybe_ if you feel up to it, you might be
able to get some interesting stuff for xLights from Claude or ChatGPT or whatever; just
gotta give it something to go on and see what happens!

Thanks for reading!

