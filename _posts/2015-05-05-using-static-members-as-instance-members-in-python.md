---
title: Using Static Members as Instance Members in Python
date: 2015-05-05
category: Software
tags:
- python
-  inheritance
- object-oriented programming
- static
- instance
---

In the Field system I built with Python (covered in the Field Encapsulation Pattern series of posts, found
[here]({{ site.baseurl }}{% link _posts/2015-02-28-field-encapsulation-pattern-in-python-part-1-getters-and-setters.md %})), I ended up coming across an interesting problem. I thought I'd post my thoughts on this issue and
how I ended up solving it.

As a quick recap, the system defines classes which are definitions of fields on a data model, representing the rules on
how to store, represent, and validate, say, a date, a url, etc. Each of these fields will have a list of validation
rules that it has to meet. An example of this is an <code>IntegerField</code> class which has a rule stating that the value must be
an integer.

```python
# field definition
class IntegerField(Field):
    default_clean_funcs = [validators.is_integer]

# field usage
class MyModel(Model):
    fields: {
        'my_integer_field': IntegerField('my_integer_field')
    }
```

The classes also have the added flexibility to accept additional validation rules from the user. This allows the user to
pass in rules saying "this integer must be greater than zero" or "this integer must be odd" rather than defining
additional field classes. This is very powerful because, without this functionality, I'd have to define more classes:
a <code>PositiveIntegerField</code>, and an <code>OddIntegerField</code>. What if I want to mix the two? in class form: it's a
<code>PositiveOddIntegerField</code> (or is it an <code>OddPositiveIntegerField</code>?). Now, let's say I want the value of the field
to be limited to numbers less than 100; now I have 3 more classes, and naming becomes a huge problem. Instead of this
mess, I just pass the validation functions into the <code>IntegerField</code> constructor.

```python
class MyModel(Model):
    fields: {
        'pos_int': IntegerField('pos_int', clean_funcs=[validators.is_positive]),
        'odd_int': IntegerField('odd_int', clean_funcs=[validators.is_odd]),
        'pos_odd_int': IntegerField('pos_odd_int', clean_funcs=[validators.is_odd, validators.is_positive]),
        ...
    }
```
 
Great. Now, the problem I came across is in the constructor of the field object. See, in the <code>IntegerField</code> definition
above, <code>default_clean_funcs</code> is a class or static variable, not an instance variable. This means that it's shared
among all instances of the class or, and this is important, among all instances of its subclasses. This is where I
initially walked right into it.
    
So, Python uses the keyword <code>self</code> to differentiate variables on the instance from those in local scope. The...
problem?... well, issue I had was that <code>self.my_var</code> will resolve to either an instance or a static variable, not
just to an instance. Therefore, when I originally wrote the Fields, I did this:

```python
class Field(object):
    clean_funcs = []
    
    def __init__(self, addl_clean_funcs=[])
        self.clean_funcs += addl_clean_funcs
```
            
I was assuming that <code>self</code> would only resolve to an instance member, creating it if it doesn't
yet exist (after all, this is how you define instance members, by using the <code>self</code> keyword in the <code>__init__</code>
function. After experiencing bugs where a UUID wasn't being validated as an Integer (among other bugs), I realized that 
<code>self.clean_funcs</code> was actually resolving to the static member, so I had to resolve it.

## Solution 1
For the posts which I wrote, and originally, I resolved it using the following method:

```python
class Field(object):
    default_clean_funcs = []
    
    def __init__(self, addl_clean_funcs=[]):
        self.clean_funcs = default_clean_funcs + addl_clean_funcs
```
            
This is perfectly functional, but I don't like it. You see, I end up making needless copies of the objects defined in
<code>default_clean_funcs</code>. Okay, technically they're pointers, so it's really not all that horrible; it still feels like
wasted space to me. Not only that, but it's somewhat dangerous in my opinion. If I have an instance member in an object,
unless it's explicitly stated, I ought to be able to modify that instance member with impunity; from the object's
perspective, it's MY content, it's part of MY definition, why shouldn't I be able to change it? In the example above, if
one of the children modifies one of the functions defined in <code>default_clean_funcs</code>, it will be modified in EVERY
child of that field which can break all the things. A simple way to get around this is to make a deep copy of 
<code>default_clean_funcs</code>, but now you really ARE making needless copies, and that will take up a bunch of room, so I
don't like this approach. Not horrible, but there's risk.

## Solution 2
```python
class Field(object):
    def __init__(self):
        self.clean_funcs = []

class IntegerField(object):
    def __init__(self, addl_clean_funcs=[]):
        super(IntegerField, self).__init__(self)
        self.clean_funcs += addl_clean_funcs
```

This one has two fatal flaws for my design. First, we come back to the bajillions of copies of validation functions that
exists in Solution 1. The second major issue is that I have to do a lot of overloading <code>__init__</code>. If you'll recall
my original design, I basically want to just have a two-line class definition if possible:

```python
class IntegerField(Field):
    clean_funcs=[validators.is_int]
```
        
and offload all the common crap onto the parent. So this solution just won't work.

## Solution 3
```python
class Field(object):
    default_clean_funcs = []
    
    def __init__(self, addl_clean_funcs=[]):
        self.addl_clean_funcs = addl_clean_funcs
    
    def get_clean_funcs():
        return self.default_clean_funcs + self.addl_clean_funcs
```
            
One benefit of this is that I only ever have the initial definition of <code>default_clean_funcs</code>; there's no wasted
space there. Another huge (to me, at any rate) benefit is that there's a clear separation of intention here.
<code>default_clean_funcs</code> is on the class level; there's never any obfuscation about that fact. <code>addl_clean_funcs</code>
is kept separate because those will change from instance to instance. Then, to get a summary of all the rules (in order
to do validation, probably), you have to call <code>get_clean_funcs</code>; since you're returned a value rather than accessing
a member, it's strongly implied that any changes you may make to the value are going to be transient. In reality, this
is not the case; you're still getting pointers to the function objects rather than copies, but doing the changes will
be discouraged because you'd have to do them every time you fetch all the clean functions.

Drawback is that you'll be doing these operations every time you want a list of the clean functions. Now, you could cache
the results, but then you'd have pointers in a cache which you can modify... that's no good. Again, you could get around
this by making deep copies of the clean funcs, and in my opinion, it's more okay in this instance. At least you know the
copies will be used instead of in the constructor case where you won't know.

## Winner Winner, Chicken Dinner
In the end, we went with Solution 3 for production. Performance-wise and bug-wise, it's been fine for the several weeks
since I wrote that post and system. I'm still trying to find a better solution, but I think this one is probably about
as good as I need to get. If you have any suggestions, please let me know in the comments below!
    

