---
title: Field encapsulation pattern in Python, part 1 - Getters and Setters
date: 2015-02-28
category: Software
tags:
- python
- getter/setter
- pattern
- encapsulation
---

### Some background
At work, we're currently spooling up more and more Python, which I think is great! I love working with Python. However,
with this shift, we're moving away from an ORM framework in PHP which had things like attribute validation, and we're not
using one in Python which does the same. So, now I'm up against validating in a dynamically typed language efficiently
and with the least amount of code possible. The thing with a dynamically typed language is that you can assign whatever
value you want to whatever variable you want; if I want attributes of this object to be of a certain type, I have to do
that myself.

Another thing which Python doesn't have: protected or private attributes. If I want to make some attribute read-only 
(say, a created date stamp), again, I have to do that myself. Also, since I'm going to be JSON-serializing this object,
I need to create a separate way of accessing the attribute which gives me a serializable value instead of the "real"
value. While [`pickle`](https://docs.python.org/2.7/library/pickle.html) is great for serializing just about everything, I need JSON for language independence.

### Just gimme the requirements, already!
In fact, there are a couple other things I will need to be able to do with the attributes on an object. Let's just list
all of them:

1. **Type safety**: we need to be sure that an attribute is of a defined type
2. **Required**: we need some attributes while others are optional
3. **Read Only**: certain attributes should be read-only
4. **Serialized representation**: during serialization, we need to convert the unserializable value to one which can be
                                json-encoded
5. **Default value**: Some attributes need to have a default value, in case we don't receive one.

Over the next couple articles, I'm going to go from a very basic Python object to one which provides all of these in a 
concise, scalable, and simple framework. When done, adding a new attribute will be as simple as adding one line of code
and, if needed, a validation function!

### Starting simple
Let's start with a basic class.

```python
>>> class MyClass:
...     def __init__(self):
...             self.my_uuid = uuid.uuid4()
... 
>>>
```

Very simple. I have a class with a single attribute which is initialized to be a [`UUID`](https://docs.python.org/2.7/library/uuid.html), a Python object
wrapping the concept of a [universally unique identifier](https://en.wikipedia.org/wiki/Universally_unique_identifier). So, I can do something like this:

```python
>>> obj = MyClass()
>>> obj.my_uuid
UUID('35eeda9a-d91e-4f1d-8938-eaf5e3b891eb')
```
   
But, because there's no static typing, I can also do this:

```python
>>> obj.my_uuid = 'invalid data'
>>> obj.my_uuid
'invalid data'
```

Oh no! If some other piece of code wanted to use this attribute assuming it's a `UUID` object, it'd be hosed.

```python
>>> def print_uuid(a_uuid):
...     print a_uuid.hex
...
>>> print_uuid(obj.my_uuid)
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
AttributeError: 'str' object has no attribute 'hex'
```

Since the value is now a `str` rather than a `UUID`, it doesn't have the `hex` property. To protect against failures like this,
we can do a type check at the point of using it:

```python
>>> def print_uuid(a_uuid):
...     if isinstance(a_uuid, uuid.UUID):
...         print a_uuid.hex
...     else:
...         print "not a valid uuid"
... 
>>> print_uuid(obj.my_uuid)
not a valid uuid
```

Well, at least we're not getting an error. Still not ideal, because what happens if we want to use it somewhere else?
Let's create another function which takes a `UUID`:

```python
>>> def print_uuid_version(a_uuid):
...     if isinstance(a_uuid, uuid.UUID):
...         print a_uuid.version
...     else:
...         print "not a valid uuid"
... 
>>> def print_uuid(a_uuid):
...     if isinstance(a_uuid, uuid.UUID):
...         print a_uuid.hex
...     else:
...         print "not a valid uuid"
... 
>>> print_uuid_version(obj.my_uuid)
not a valid uuid
>>> print_uuid(obj.my_uuid)
not a valid uuid
>>>
>>> # let's compare this to a new object with a valid uuid
>>> new_obj = MyClass()
>>> print_uuid_version(new_obj.my_uuid)
4
>>> print_uuid(a_uuid)
'78ba1da95b324124a7d3ae740a000856'
```

Well, while we're not throwing errors, we have violated DRY: Don't Repeat Yourself. It would be much better if we had a
way to verify that `my_uuid` is actually a `UUID` instead of checking it every single place it's going to be accessed.

This is where getters and setters come into play. You use functions to fetch and assign
the value of the attribute, rather than accessing it directly. This allows you to do some verification before setting it.
Take this reimagining of MyClass:

```python
>>> class MyClass:
...     def __init__(self):
...         self.my_uuid = uuid.uuid4()
...
...     def get_my_uuid(self):
...         return self.my_uuid
...
...     def set_my_uuid(self, value):
...         if not isinstance(value, uuid.UUID):
...             # bad value; do what you like here
...             raise ValueError('my_uuid must be a UUID')
...         self.my_uuid = value
...]
```

This is much better. Instead of calling `my_uuid` directly to get or set the value, you'd call `get_my_uuid()` or
`set_my_uuid(new_value)`, respectively. Great!

The trouble is that people can still bypass this by just using `my_uuid`; there's nothing preventing that. Now, while
there are no such things as protected or private attributes in Python, we can protect this even more, using decorators.

```python
>>> class MyClass:
...     def __init__(self):
...         self.my_uuid = uuid.uuid4()
...
...     @property
...     def my_uuid(self):
...         return self._my_uuid
...
...     @my_uuid.setter
...     def my_uuid(self, value):
...         if not isinstance(value, uuid.UUID):
...             # bad value; do what you like here
...             raise ValueError('my_uuid must be a UUID')
...         self._my_uuid = value
...
```

So, let's see what exactly is going to happen here. Assume we have an instance of `MyClass` called `obj`, as we have had
in the examples. When we do the following:

```python
>>> obj.my_uuid
```

Python will notice that there is a function with the `@property` decorator named `my_uuid` and call that function instead
of attempting to access the attribute directly. Therefore, this results in the following:

```python
>>> obj.my_uuid
UUID('35eeda9a-d91e-4f1d-8938-eaf5e3b891eb')
```

Internally, the value will be retrieved from an internal attribute `_my_uuid`. (Note: this attribute is still available
outside of the class and can be used just like any other attribute. PLEASE don't give in to the temptation to use it,
though; you're protecting it for a reason!)
    
Now, let's take a look at what happens when we write to that property with a `UUID` object (the same kind of thing will
happen if you pass a bad value).

```python
>>> obj.my_uuid = uuid.uuid4()
```

At this point, Python will recall that, with the `@my_uuid.setter` decorator, we should call that function, passing the
value you want to assign as an argument to that function. The function, as we already know, will check the type of the
value and, if it's a `UUID`, it will be written to the internal attribute `_my_uuid` previously referenced. Of course,
if we write bad data, we'll still get an error:

```python
>>> obj.my_uuid = 'invalid data'
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
  File "<stdin>", line 10, in my_uuid
ValueError: my_uuid must be a UUID
```

So far so good! Going back to our original set of requirements, we're covering #1: Type safety. We can now be sure that
any time someone fetches `my_uuid`, it's going to be of type `uuid.UUID`.

In the next installment, [which you can find here]({{ site.baseurl }}{% link _posts/2015-03-03-field-encapsulation-pattern-in-python-part-2-setattr-and-getattr.md %}), we'll be adding more attributes to the object and exploring what happens when the attributes
have different types. Until then, have fun!

