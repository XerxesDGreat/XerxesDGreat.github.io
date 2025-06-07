---
title: Python Scoping
date: 2015-12-04
category: Software 
tags: 
- python scope
---

See, Python has a fun interpretation of scoping. Let's say I define a variable and a function at the same level, then
access the variable from the function; the function will read the variable just fine. This is because Python looks for
the variable in the current scope, then bumps up a scope level, looks again, etc. until it finds it or runs out of scope.

```python
my_var = 'abcd'

def my_func():
    print my_var
    
my_func()
> "abcd"
```
    
However, things change when you write to the variable. At that point, if the variable doesn't already exist in this
scope, Python will create it, regardless of whether it's in a different scope. Again, this is all logical, but it looks
a little weird.

```python
my_var = 'abcd'

def my_func():
    print my_var
    my_var = 'defg'
    print my_var

my_func()
> "abcd"
> "defg"

print my_var
> "abcd"
```