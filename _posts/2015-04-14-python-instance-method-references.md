---
title: Python Instance Method References
date: 2015-04-14
category: Software
tags: 
- python
- method references
- callback
- method binding
---

So, I came across something pretty interesting while coding in Python today. I was writing a system in which I have to
pass a function as an argument to be called later; a.k.a. a callback. I've done this in a lot of different
contexts in languages like Python, PHP, JavaScript, Java, and ActionScript, so that's why I was taken aback by my
experience today.

I have one class which takes a function or a list of functions for calling later; the signature of the function will
look like this:

<!-- more -->

```python
# defining the callback
def my_callback(value):
    # do something
    
# adding it
self.callbacks = [my_callback]

# executing the callbacks
for c in self.callbacks:
    c(some_value)
```

Originally, I was just defining a bunch of these functions in a separate module; they're all generic functions, not in
classes, or anything. Everything worked great.

But then I decided to start passing in a method on an instance for the callback. Since I needed some of the state of the
instance during the callback, I decided to modify the signature to add that context.

```python
# defining the callback
def my_callback(self, value):
    # do something

# adding it
self.callbacks = [self.my_callback]

# executing the callbacks
for c in self.callbacks:
    c(self, some_value)
```
        
So now, even though I don't need the context in the module functions, I'll get it in the instance functions.

Or so I thought.

It turns out that, by doing this, I ended up passing in the ```self``` context object twice because Python does something
pretty clever: when providing a reference like ```self.my_callback```, the ```self``` context _becomes a part of the
callback_. Therefore, I didn't have to change the function signature at all, and the instance method will get both the
```self``` and ```value``` args. Looking into it, the same thing happens when calling things from a class context, say
if I were to pass ```MyClass.my_callback``` instead of ```self.my_callback```.

This is very clever, but not immediately clear and is different from other languages I've done this in. Then again, in 
other languages, the context (```self``` in the case of an instance method, ```cls``` in the case of a class method, or
nothing in the case of a static function) is not explicitly part of the function signature and is only implied by
certain keywords when defining the function... mainly just the inclusion or exclusion of ```static``` since I'm not
aware of a distinction between static and class functions in anything but python.

The reason it does this is due to method binding. If a function has ```self``` as its first argument and the function
is referenced on an instance of the class, then it's _bound_ to the object. You can have an _unbound_ version of the 
function, say if you used ```MyClass.instance_method``` instead of referencing it on an instance of MyClass; it won't
work properly however, because the function requires us to have an instance of the object as the first argument.

The same kind of thing happens when we declare the class method, only this time, it's _bound_ to the class, rather than
the object. As best as I can tell, you can't have an unbound class method because the class is always available if the
function is. In the case of a static function, it isn't bound to anything; it is more or less just namespaced on the
class; as such, it is neither bound nor unbound.

So, what does _bound_ mean? It means that, when the function is called, it already has the thing to which it's bound and
it will be passed into the function as the first argument (the ```self``` for instance methods, the ```cls``` for class
methods). This is just another example of functions being first-class objects; they each contain the state relevant to
their execution. Very cool!

Therefore, using the above knowledge, I can have something like this:

```python
callbacks = []
def add_callback(callback):
    callbacks.append(callback)

def do_thing_function(*args):
    print args

class MyObject(object):
    def do_thing_instance(*args):
        print args
    
    @classmethod
    def do_thing_class(*args):
        print args
    
    @staticmethod
    def do_thing_static(*args):
        print args

add_callback(do_thing_function)

o = MyObject()
add_callback(o.do_thing_instance)
add_callback(MyObject.do_thing_instance)
add_callback(MyObject.do_thing_class)
add_callback(MyObject.do_thing_static)

value = "stringy value"
for c in callbacks:
    print "calling function %s" % c.__name__
    c(value)

# output
calling function do_thing_function
('stringy value',)
calling function do_thing_instance
(<__main__.MyObject object at 0x10cc6e350>, 'stringy value')
calling function do_thing_class
(<class '__main__.MyObject'>, 'stringy value')
calling function do_thing_static
('stringy value',)
```
    
As you can see, we get different things in the function body, even though we're only explicitly passing in one value at
time of execution. Yay contextual function execution!
