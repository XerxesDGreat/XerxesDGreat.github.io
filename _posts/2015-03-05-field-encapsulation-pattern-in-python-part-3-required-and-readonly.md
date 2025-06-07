---
title: Field encapsulation pattern in Python, part 3 - Required and Read-only
date: 2015-03-05
category: Software
tags: 
- python
- getter/setter
- pattern
- encapsulation
- __setattr__
- __getattr__
---

Welcome back to creating a field encapsulation pattern in Python! As you may be aware, this is the third installment in the
series. To catch up, you can read [part 1]({{ site.baseurl }}{% link _posts/2015-02-28-field-encapsulation-pattern-in-python-part-1-getters-and-setters.md %}) and [part 2]({{ site.baseurl }}{% link _posts/2015-03-03-field-encapsulation-pattern-in-python-part-2-setattr-and-getattr.md %}); I'll wait. Ready? Let's go!

### Where are we?
First, let's review the requirements for this project: 

1. **Type safety**: we need to be sure that an attribute is of a defined type
2. **Required**: we need some attributes while others are optional
3. **Read Only**: certain attributes should be read-only
4. **Serialized representation**: during serialization, we need to convert the unserializable value to one which can be
                                json-encoded
5. **Default value**: Some attributes need to have a default value, in case we don't receive one.

At the end of part 2, we'd solved for Type Safety by introducing a `__getattr__` and `__setattr__` function which check
incoming and outgoing get/set requests against a dictionary of attribute names and types, allowing only certain attributes
to be written, and only certain types to be written to those attributes. Let's build on this by tackling our next
requirement: the ability to mark an attribute as `required`.

### How to get to required
This is an important one; often when creating objects, there are a few attributes which need to be set, some data which
needs to be passed in. Typically, there are two ways to give data to a new object: one is to pass the data into the 
`__init__` function (using positional or keyword arguments, a dictionary containing the data, etc.), and the other is to
construct the object and then pass in the data via setters. The second way would exercise our `__setattr__` function,
but it's hard to require that certain functions be called externally, not to mention the additional code which would have
to be written everywhere this object is used. As a result, we'll be passing data into the `__init__` function.

### Initializing
From last time, let's assume that `my_uuid`, `your_uuid`, and `created_datetime` are the required attributes and build
our constructor

```python
>>> class MyClass:
...     def __init__(self, my_uuid, your_uuid, created_datetime):
...         self.my_uuid = my_uuid
...         self.your_uuid = your_uuid
...         self.created_datetime = created_datetime
```
 
I like this pattern; it's clear what arguments are expected, and it's going to give you errors in your IDE if you don't
supply values to these arguments. My main argument against this pattern is that, for every argument you add to the
signature, you have to add another line to assign it. Not a HUGE problem; I mean, you shouldn't be changing your signature
all that often anyways. So, this is valid. I'll give you another approach which is less clear, but will ultimately do
the same thing, and will set us up for later work.

```python
>>> class MyClass:
...     def __init__(self, **kwargs):
...         for required_field in ['my_uuid', 'your_uuid', 'created_datetime']:
...             if required_field not in kwargs:
...                 raise KeyError('field %s is required to build this object' % required_field)
...             self.__setattr__(required_field, kwargs[required_field])
...
```

Yes, I know that you still have to change code to add a new required field, but it's only added in one place. Also, you
*could* make the body of the `for` loop only one line by just letting the `KeyError`, which would be raised by accessing
`kwargs` with a bad key, bubble up. Your choice. I like the custom message, so that's what I'm sticking with.

### Make it Generic
Okay, so I lied. I don't like the required field list buried in the `__init__` call. The main reason is that we've now
duplicated the definition of fields. Instead of one source of truth, we now have two lists of fields:
`attribute_types` which defines the types of the attributes, and the list in the `__init__` function. If I change an attribute
name, I have to change it in two places now. This is less than ideal.

So, why don't we do something similar to what we did for the field validation? Since we already have a list of the
fields, we can just do a little modification to add the required flag to it. Let's do that; instead of being just a
map of attribute types, we'll make it a nested dictionary of attribute details, where the key is the field name (as
before) and the values are dictionaries with both validator and required keys:

```python
>>> class MyClass:
...     attribute_details = {
...         'my_uuid': {'type': uuid.UUID, 'required': True},
...         'your_uuid': {'type': uuid.UUID, 'required': True},
...         'uuid_a': {'type': uuid.UUID, 'required': False},
...         'uuid_b': {'type': uuid.UUID, 'required': False},
...         'created_datetime': {'type': datetime.datetime, 'required': True},
...         'updated_datetime': {'type': datetime.datetime, 'required': False},
...         'target_datetime': {'type': datetime.datetime, 'required': False},
...         'name': {'type': StringType, 'required': False},
...         'location': {'type': StringType, 'required': False},
...         'num_actions_taken': {'type': IntType, 'required': False}
...     }
...
...     def __init__(self, **kwargs):
...         for field_name, details in self.attribute_details.iteritems():
...             if details['required'] and field_name not in kwargs:
...                 raise KeyError('%s is required' % field_name)
...             elif field_name in kwargs:
...                 self.__setattr__(field_name, kwargs[field_name])
...
>>> a = MyClass(my_uuid=uuid.uuid4(), your_uuid=uuid.uuid4(), created_datetime=datetime.datetime.now())
>>> print a
<__main__.MyClass instance at 0x10497af38>
>>> b = MyClass(my_uuid=uuid.uuid4()) # let's leave off some required attributes
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
  File "<stdin>", line 17, in __init__
KeyError: 'your_uuid is required'
>>>
```

Note how this approach also saves us a few lines in the constructor; great news! What's also great news is that this will
fulfill my second requirement: the addition of required fields. We're moving right along now! Of course, we'll also have
to update `__setattr__` and `__getattr__` functions to deal with the new structure; I'll leave that as an exercise for
the time being. Don't worry, I'll give a full view of the class at the end of this lesson, as I have before.

### Read-only
Sometimes, we want certain fields to be read-only; ids of objects, created times, who created this object, etc. This
class is no different; we have a couple fields which shouldn't be changed. The approach we're going to take is pretty
similar to that which we did for required. This time, we're going to be modifying the `__setattr__` function (I guess
you'll be getting a look at the newly revamped function sooner rather than later!). Following in the pattern we used
for the required setting, we'll be adding a new dict key on the `attribute_details` map. Let's do the code changes and
update `uuid_a`, `uuid_b`, `created_datetime`, and `name` to be read-only:

```python
>>> class MyClass:
...     attribute_details = {
...         'my_uuid': {'type': uuid.UUID, 'required': True, 'read_only': False},
...         'your_uuid': {'type': uuid.UUID, 'required': True, 'read_only': False},
...         'uuid_a': {'type': uuid.UUID, 'required': False, 'read_only': False},
...         'uuid_b': {'type': uuid.UUID, 'required': False, 'read_only': False},
...         'created_datetime': {'type': datetime.datetime, 'required': True, 'read_only': False},
...         'updated_datetime': {'type': datetime.datetime, 'required': False, 'read_only': False},
...         'target_datetime': {'type': datetime.datetime, 'required': False, 'read_only': False},
...         'name': {'type': StringType, 'required': False, 'read_only': False},
...         'location': {'type': StringType, 'required': False, 'read_only': False},
...         'num_actions_taken': {'type': IntType, 'required': False, 'read_only': False}
...     }
...
...     ...
...
...     def __setattr__(self, attr_name, value):
...         attr_detail = self.attribute_details.get(attr_name, None)
...         if not attr_detail:
...             raise AttributeError('no attribute %s in object of type %s' % (attr_name, self.__class__.__name__))
...         if attr_detail['read_only']: 
...             raise AttributeError('%s is read-only' % attr_name)
...         if type(value) is not intended_type:
...             raise ValueError('%s expected to be a %s' % (attr_name, intended_type.__name__))
...         self.__dict__['_%s' % attr_name] = value
...
...    ...
...
>>> a = MyClass(my_uuid=uuid.uuid4(), your_uuid=uuid.uuid4(), created_datetime=datetime.datetime.now())
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
  File "<stdin>", line 19, in __init__
  File "<stdin>", line 25, in __setattr__
AttributeError: created_datetime is read-only
```

Uh-oh. What happened? Well, looking up to the constructor, `__setattr__` is going to be called in the `__init__` function
and we have a required attribute which is also read-only. Since this is a perfectly valid case, we have to modify the 
logic so we can use `__setattr__` for the object initialization (to reuse code) AND protect against later writes to that
value. The way I've decided to approach this is with an internal flag which simply indicates we're currently initializing
the object:

```python
>>> class MyClass:
...
... ...
...
... def __init__(self, **kwargs):
...     self.__dict__['_in_init'] = True
...     # do everything involved in initialization
...     self.__dict__['_in_init'] = False
...
... def __setattr__(self, attr_name, value):
...     # get detail
...     if attr_detail['read_only'] and not self.__dict__['_in_init']:
...         raise AttributeError('%s is read-only' % attr_name)
...     # everything else
...
>>> a = MyClass(my_uuid=uuid.uuid4(), your_uuid=uuid.uuid4(), created_datetime=datetime.datetime.now())
>>> a.created_datetime
datetime.datetime(2015, 3, 5, 18, 9, 58, 316153)
>>> a.created_datetime = datetime.datetime.now()
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
  File "<stdin>", line 27, in __setattr__
AttributeError: created_datetime is read-only
```

*(For a reminder, `__dict__` is a way to directly read from/write to class attributes. It's not recommended to use it
frequently, simply because then you lose all the magic which can be brought up by setters/getters and `__setattr__` and
`__getattr__`. However, in this case, we want to bypass all that, hence our using it)*  

There we go; much better! We've achieved our third requirement: read-only attributes! Now, when we get handed an object
of type `MyClass`, we can be reasonably sure that certain attributes are set, that they are of particular types, and that
certain attributes will remain unchanged - except by potential internal operations - no matter what we do to the object.

### Current version of `MyClass`
Man oh man, looking good. As promised, here's the class as it looks now:

```python
>>> from types import *
... import uuid
... import datetime
...
... class MyClass:
...     attribute_details = {
...         'my_uuid': {'type': uuid.UUID, 'required': True, 'read_only': False},
...         'your_uuid': {'type': uuid.UUID, 'required': True, 'read_only': False},
...         'uuid_a': {'type': uuid.UUID, 'required': False, 'read_only': True},
...         'uuid_b': {'type': uuid.UUID, 'required': False, 'read_only': True},
...         'created_datetime': {'type': datetime.datetime, 'required': True, 'read_only': True},
...         'updated_datetime': {'type': datetime.datetime, 'required': False, 'read_only': False},
...         'target_datetime': {'type': datetime.datetime, 'required': False, 'read_only': False},
...         'name': {'type': StringType, 'required': False, 'read_only': True},
...         'location': {'type': StringType, 'required': False, 'read_only': False},
...         'num_actions_taken': {'type': IntType, 'required': False, 'read_only': False}
...     }
...
...     def __init__(self, **kwargs):
...         self.__dict__['_in_init'] = True
...         for field_name, details in self.attribute_details.iteritems():
...             if details['required'] and field_name not in kwargs:
...                 raise KeyError('%s is required' % field_name)
...             elif field_name in kwargs:
...                 self.__setattr__(field_name, kwargs[field_name])
...         self.__dict__['_in_init'] = False
...
...     def __setattr__(self, attr_name, value):
...         attr_detail = self.attribute_details.get(attr_name, None)
...         if not attr_detail:
...             raise AttributeError('no attribute %s in object of type %s' % (attr_name, self.__class__.__name__))
...         if attr_detail['read_only'] and not self.__dict__['_in_init']:
...             raise AttributeError('%s is read-only' % attr_name)
...         if type(value) is not attr_detail['type']:
...             raise ValueError('%s expected to be a %s' % (attr_name, attr_detail['type'].__name__))
...         self.__dict__['_%s' % attr_name] = value
...
...     def __getattr__(self, attr_name):
...         if attr_name not in self.attribute_details:
...             raise AttributeError('no attribute "%s" in object of type %s' % (attr_name, self.__class__.__name__))
...         return self.__dict__['_%s' % attr_name]
```

It's starting to beef up in size, but it's still less than 40 lines, and think of all the functionality we're getting!
However, in the next episode, we're going to add a few lines, but that will pave the way for a whole new level of utility.
So, see you then!

