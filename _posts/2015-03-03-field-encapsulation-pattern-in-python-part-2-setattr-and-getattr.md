---
title: Field encapsulation pattern in Python, part 2 - __setattr__ and __getattr__
date: 2015-03-03
category: Software
tags: 
- python
- getter/setter
- pattern encapsulation
- __setattr__
- __getattr__
---

This is part 2 of a detailed series on my implementation of a field encapsulation pattern, continued from [part 1]({{ site.baseurl }}{% link _posts/2015-02-28-field-encapsulation-pattern-in-python-part-1-getters-and-setters.md %}).
If you recall from the last time, we introduced the idea of getters and setters, properly called "properties" in Python.
If you *don't* recall, please take a moment and hit up [part 1]({{ site.baseurl }}{% link _posts/2015-02-28-field-encapsulation-pattern-in-python-part-1-getters-and-setters.md %}) before going on. Now, here we go!

Where we left off, we were able to protect our attribute by using decorators to create a getter and a setter which will
protect the field from bad values. Here's what it looked like at the end of part 1:

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

However, we're going to stir things up and finalize the first requirement I have: Type Safety. Let's assume that we're
adding another attribute (if I haven't made it clear, I'll be using "field" and "attribute" interchangeably) to the
object and it also is supposed to be a uuid (my real-world object has four, so this isn't unreasonable). Using the
getter/setter decorators, this is what it could look like:

```python
>>> class MyClass:
...     def __init__(self):
...         self.my_uuid = uuid.uuid4()
...         self.your_uuid = uuid.uuid4()
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
...     @property
...     def your_uuid(self):
...         return self._your_uuid
...
...     @your_uuid.setter
...     def your_uuid(self, value):
...         if not isinstance(value, uuid.UUID):
...             # bad value; do what you like here
...             raise ValueError('your_uuid must be a UUID')
...         self._your_uuid = value
... 
```

Not great; we've just about doubled the size of the class! However, we notice there's a lot of code similarities, namely
checking for the `UUID` type in the setters, which could be generalized. Let's do that now.

```python
>>> class MyClass:
...     def __init__(self):
...         self.my_uuid = uuid.uuid4()
...         self.your_uuid = uuid.uuid4()
...
...     @property
...     def my_uuid(self):
...         return self._my_uuid
...
...     @my_uuid.setter
...     def my_uuid(self, value):
...         self._assert_uuid(value)
...         self._my_uuid = value
...
...     @property
...     def your_uuid(self):
...         return self._your_uuid
...
...     @your_uuid.setter
...     def your_uuid(self, value):
...         self._assert_uuid(value)
...         self._your_uuid = value
...
...    def _assert_uuid(self, potential_uuid):
...        if not isinstance(potential_uuid, uuid.UUID):
...             raise ValueError('must be a UUID')
... 
```

Better... but we still have code duplication; the `@property` and `@*.setter` methods look practically identical.  This
is where we can start using Python's magic methods! These methods are called upon various different parts of the typical
object operations. For a (very) exhaustive list and demonstration of them all, you can check out Rafe Kettler's [Guide
to Python's Magic Methods](http://www.rafekettler.com/magicmethods.html); the ones we'll be interested in are `__getattr__`, which gets called whenever we try
to access an attribute which doesn't exist on the object, and `__setattr__`, which gets called every time an
attribute is written to. The former receives the attribute name which we're looking for as an argument, while the latter
takes both the attribute's name and its potential value. Here they are in use:

```python
>>> class MyClass:
...     def __init__(self):
...         self.my_uuid = uuid.uuid4()
...         self.your_uuid = uuid.uuid4()
...
...     def __setattr__(self, attr_name, value):
...         self._assert_uuid(value)
...         self.__dict__['_%s' % attr_name] = value
...
...     def __getattr__(self, attr_name):
...         return self.__dict__['_%s' % attr_name]
...
...    def _assert_uuid(self, potential_uuid):
...        if not isinstance(potential_uuid, uuid.UUID):
...             raise ValueError('must be a UUID')
... 
```

Looking better! As I mentioned, I had four uuid attributes on my object; let's add them:

```python
>>> class MyClass:
...     def __init__(self):
...         self.my_uuid = uuid.uuid4()
...         self.your_uuid = uuid.uuid4()
...         self.uuid_a = uuid.uuid4()
...         self.uuid_b = uuid.uuid4()
...
...     def __setattr__(self, attr_name, value):
...         self._assert_uuid(value)
...         self.__dict__['_%s' % attr_name] = value
...
...     def __getattr__(self, attr_name):
...         return self.__dict__['_%s' % attr_name]
...
...    def _assert_uuid(self, potential_uuid):
...        if not isinstance(potential_uuid, uuid.UUID):
...             raise ValueError('must be a UUID')
...
```

Wow, only two new lines!

So, I hate to break it to you; it's not all fun and games. There's a pretty major flaw with this, as cool as
it seems: what happens if I want a datetime attribute? I'll add it in the `__init__` function:

```python
...    def __init__(self):
...        self.created_datetime = datetime.datetime.utcnow()
```

And then I'll build a new object to test changing the attribute:

```python
>>> obj = MyClass()
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
  File "<stdin>", line 7, in __init__
  File "<stdin>", line 9, in __setattr__
  File "<stdin>", line 13, in _assert_uuid
ValueError: must be a UUID
```

What happened? Remember when I said that ALL attributes go through `__setattr__`? That includes during internal
assignments, such as during `__init__`. Shucks. So how do we get around this? One way is to check which
attribute we're writing to in the `__setattr__` function, doing one thing for the `created_datetime` and another for the
`uuid` fields. In this case, we'd like to make sure that `created_datetime` is a type of `datetime.datetime`.

```python
>>> import datetime
>>> class MyClass:
...     def __init__(self):
...         self.my_uuid = uuid.uuid4()
...         self.your_uuid = uuid.uuid4()
...         self.uuid_a = uuid.uuid4()
...         self.uuid_b = uuid.uuid4()
...         self.created_datetime = datetime.datetime.utcnow()
...
...     def __setattr__(self, attr_name, value):
...         if attr_name == 'created_datetime':
...             self._assert_datetime(value)
...             self._created_datetime = value
...         else:
...             self._assert_uuid(value)
...             self.__dict__['_%s' % attr_name] = value
...
...     def __getattr__(self, attr_name):
...         return self.__dict__['_%s' % attr_name]
...
...     def _assert_uuid(self, potential_uuid):
...         if not isinstance(potential_uuid, uuid.UUID):
...              raise ValueError('must be a UUID')
...
...     def _assert_datetime(self, potential_date):
...         if value is not datetime.datetime:
...             raise ValueError('created_datetime expected to be a datetime.datetime')
... 
>>> obj = MyClass()
>>>
```
    
Man, looking good! But... well, let's add another date field for when this was updated. We could just add another check
for the `attr_name`, but that will end up getting unmaintainable really fast. Here's how that would look:
 
```python
>>>     def __setattr__(self, attr_name, value):
...         if attr_name in ['created_datetime', 'updated_datetime']:
...             ...
```

Instead, we can have a map of attributes to their expected types: given the attribute name, we can see what type it's
expected to be. We can also get rid of the `_assert_*` functions, as we can do that generically also:

```python
>>> class MyClass:
...     attribute_types = {
...         'my_uuid': uuid.UUID,
...         'your_uuid': uuid.UUID,
...         'uuid_a': uuid.UUID,
...         'uuid_b': uuid.UUID,
...         'created_datetime': datetime.datetime,
...         'updated_datetime': datetime.datetime
...     }
...
...     def __init__(self):
...         self.my_uuid = uuid.uuid4()
...         self.your_uuid = uuid.uuid4()
...         self.uuid_a = uuid.uuid4()
...         self.uuid_b = uuid.uuid4()
...         self.created_datetime = datetime.datetime.utcnow()
...         self.updated_datetime = datetime.datetime.utcnow()
...
...     def __setattr__(self, attr_name, value):
...         intended_type = self.attribute_types.get(attr_name)
...         if intended_type and not isinstance(value, intended_type):
...             raise ValueError('%s expected to be a %s' % (attr_name, intended_type.__name__))
...         self.__dict__['_%s' % attr_name] = value
...
...     def __getattr__(self, attr_name):
...         return self.__dict__['_%s' % attr_name]
... 
>>> obj = MyClass()
>>>
```

Yay, back down to three functions for six attributes, and it works!

Okay, time for another wrench in the works! What happens if the attribute is not in the `attribute_types` dict? The way
we have it written, it can just be applied directly to the object:

```python
>>> obj.petunias = 'are lovely'
>>> obj.petunias
'are lovely'
```

Obviously not great, but not horrible either. You can use this to your advantage; that's the nice thing about dynamic
typing. For my purposes, we don't want this. Let's alter the `__setattr__` and `__getattr__` calls to deal with this
appropriately.

```python
>>> class MyClass:
...     attribute_types = {
...         ...
...     }
...
...     def __init__(self):
...         ...
...
...     def __setattr__(self, attr_name, value):
...         intended_type = self.attribute_types.get(attr_name, None)
...         if not intended_type:
...             raise AttributeError('no attribute %s in object of type %s' % (attr_name, self.__class__.__name__))
...         if intended_type and not isinstance(value, intended_type):
...             raise ValueError('%s expected to be a %s' % (attr_name, intended_type.__name__))
...         self.__dict__['_%s' % attr_name] = value
...
...     def __getattr__(self, attr_name):
...         if attr_name not in self.attribute_types:
...             raise AttributeError('no attribute "%s" in object of type %s' % (attr_name, self.__class__.__name__))
...         return self.__dict__['_%s' % attr_name]
... 
>>> obj = MyClass()
>>> obj.petunias = 'are lovely'
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
  File "<stdin>", line 19, in __setattr__
AttributeError: no attribute "petunias" in object of type MyClass
```
    

Awesome! Now we have full control over the attributes which go into our object! Let's add a couple more attributes -- one
more date field, an integer field, and a couple string fields -- to fill in the remaining properties, and we can marvel
over what an amazing, object-oriented class we have! While we're at it, I'd like to change a couple things really quick.
I'm going to use a package in Python called `types`; this gives us some handy shortcuts to some built-in types, such as
for string or int. Below is the final form of this class in today's installment

```python
>>> from types import *
>>> class MyClass
...     attribute_types = {
...         'my_uuid': uuid.UUID,
...         'your_uuid': uuid.UUID,
...         'uuid_a': uuid.UUID,
...         'uuid_b': uuid.UUID,
...         'created_datetime': datetime.datetime,
...         'updated_datetime': datetime.datetime,
...         'target_datetime': datetime.datetime,
...         'name': StringType,
...         'location': StringType,
...         'num_actions_taken': IntType
...     }
...
...     def __init__(self):
...         self.my_uuid = uuid.uuid4()
...         self.your_uuid = uuid.uuid4()
...         self.uuid_a = uuid.uuid4()
...         self.uuid_b = uuid.uuid4()
...         self.created_datetime = datetime.datetime.utcnow()
...         self.updated_datetime = datetime.datetime.utcnow()
...         self.target_datetime = datetime.datetime.utcnow()
...         self.name = 'my name'
...         self.location = 'my location'
...         self.num_actions_taken = 0
...
...     def __setattr__(self, attr_name, value):
...         intended_type = self.attribute_types.get(attr_name, None)
...         if not intended_type:
...             raise AttributeError('no attribute %s in object of type %s' % (attr_name, self.__class__.__name__))
...         if type(value) is not intended_type:
...             raise ValueError('%s expected to be a %s' % (attr_name, intended_type.__name__))
...         self.__dict__['_%s' % attr_name] = value
...
...     def __getattr__(self, attr_name):
...         if attr_name not in self.attribute_types:
...             raise AttributeError('no attribute "%s" in object of type %s' % (attr_name, self.__class__.__name__))
...         return self.__dict__['_%s' % attr_name]
```

Whew, we came a long way! However, we are now reasonably assured that someone using this class will be matching the
desired contract: the attributes are well defined, only those attributes will exist on the object, and they will contain
a very predictable value. Sheesh, not bad for a dynamic language and only about 35 lines of code! So, I think we're done
with the type safety aspect of this class. [With the next installment]({{ site.baseurl }}{% link _posts/2015-03-05-field-encapsulation-pattern-in-python-part-3-required-and-readonly.md %}), we'll start looking at what happens if we start
making some fields required and some fields not.

