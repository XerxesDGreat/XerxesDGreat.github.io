---
title: Field encapsulation pattern in Python, part 4 - Field objects
date: 2015-03-07
category: Software
tags:
- python
- getter/setter
- encapsulation
- __setattr__
- __getattr__
- pattern
---

Here we are in the fourth portion of our trek to create a field encapsulation pattern in Python! For previous legs of our
journey, you can try [here]({{ site.baseurl }}{% link _posts/2015-02-28-field-encapsulation-pattern-in-python-part-1-getters-and-setters.md %}), [here]({{ site.baseurl }}{% link _posts/2015-03-03-field-encapsulation-pattern-in-python-part-2-setattr-and-getattr.md %}), or [here]({{ site.baseurl }}{% link _posts/2015-03-05-field-encapsulation-pattern-in-python-part-3-required-and-readonly.md %}). Otherwise, let's kick it off!

### Where are we?
By the end of our last meeting, we had made pretty good progress. We're able to type fields on an object, mark them as
required so we must provide their values when creating said object, and mark attributes as read-only so we can't change
them after the object has been created.

But, before we go any further with my requirements, let's take a step sideways. See, while the pattern we've created
thus far is very flexible, it's extremely rigid in its flexibility.

### The problem with typing
An example is in order. Currently, we can make a field be virtually any type that you can define. This is pretty awesome,
because the same code will handle an `int`, a `str`, a `uuid.UUID`, etc. However, what happens if we want to get more
specific than that? Let's say, instead of a `str` object, I want a URL? It'll still be represented as a string, but now
it has to adhere to specific factors. It has to have http, or maybe ftp, but perhaps https. Then a "://", some other 
combination of letters, numbers dashes, dots, etc. After that, it could be .com, .net, .info, .wed, or any of another
several hundred ([810, to be exact](http://en.wikipedia.org/wiki/List_of_Internet_top-level_domains) endings. Then, it could be followed by a slash with MORE letters, numbers, characters,
etc. Or not.

Now, how can we add a field which is is a URL and be sure that it's a URL? Maybe we can create a `URL` object which will
handle all that for you, and set the type of that field to be `URL`. Great... until we want to ensure it's a URL which
points to an FTP site (starting with "ftp://"). Ah. So... maybe extend `URL` to make a class `FTPURL`? What if we want to
limit the urls to only FTP sites with a top-level-domain of ".net". Are we going to be making a `FTPURLDotNet` class?

This is not the only problem with typing. IMO, it's completely reasonable to have different types for the same value
passed into `MyClass`. Example: 1425797027 instead of a datetime object referring to 6:43:47 AM on Mar. 8, 2015 in UTC.
Another example, the string 'aadac851-3453-4484-b598-6b0e06f0a960' instead of a `uuid.UUID` object wrapping this string.
You see, we could get data from json, from a database, built on the fly, etc. If a value can be translated into a valid
type, I think that it should be accepted. This doesn't mean that I should accept the string 'goat' where a `uuid.UUID`
object is expected, but I should accept something which will properly construct a `uuid.UUID` object.

### Code repetition
Another issue which is less problematic but more pernicious is the fact that we have a dictionary with all the attributes
of a field. This means that every time I want to define a field, I have to write down all the attributes for that field.
When it's just 'type', no prob. Now, it's 'type', 'required', and 'read-only'. I'll be adding at least two more. That's a
lot of code which is going to be repeated, often unnecessarily.

Now, I WILL admit that we can just have a default value in places where we use those dictionary attributes:

```python
>>> # instead of this
>>> if attribute_details[field_name]['required']:
...     # do something
...
>>> # we can do this
>>> if attribute_details[field_name].get('required', False):
...     # if the required attribute isn't set for this field,
...     # assume it's not required; same as having 'required': False
```
    
The main issue I have with this is it's more clunky; I'd rather be sure the value is there than have to go and check
for its existence every time I want to access it.

### So what are you saying?
Well, it feels that there are enough issues to warrant a refactor. To me, the most logical place to make a split is
going to be making a `Field` object. In this way, we can immediately address the code repetition concern I had, and we 
will eventually address the typing concern. So, what is the field object going to look like?

```python
>>> class Field(object):
...     def __init__(self, name, type, required=False, read_only=False):
...         self.name = name
...         self.type = type
...         self.required = required
...         self.read_only = read_only
```

Nothing fancy, just a collection of the same attributes in the dictionary. I went ahead and added the `name` of the field
so it can know what it's a representation of.

Now, I know you're asking this: why are we not doing all the protection here as we are in the main class? The main reason
is that this is going to be essentially internal to the object we're actually using. When we import `MyClass`, we probably
aren't going to be importing the `Field` object as well. Sure, that doesn't prevent us from modifying the field once it's
on an instance of `MyClass`. Well, in fact, `MyClass` is going to do that for us. Remember the `__setattr__` and
`__getattr__` functions on `MyClass` only deal with specific fields; we just have to be sure we don't include the `fields`
list as one which can be modified externally!

Yes, we're getting tricky, so let me show you what goes on here; we'll take `MyClass` from the end of last time and
update it to use the `Field` object.
   
```python
from types import *
import uuid
import datetime

class Field(object):
    def __init__(self, name, type, required=False, read_only=False):
        self.name = name
        self.type = type
        self.required = required
        self.read_only = read_only

class MyClass:
    attribute_details = {
        'my_uuid': Field('my_uuid', uuid.UUID, required=True),
        'your_uuid': Field('your_uuid', uuid.UUID, required=True),
        'uuid_a': Field('uuid_a', uuid.UUID, read_only=True),
        'uuid_b': Field('uuid_b', uuid.UUID, read_only=True),
        'created_datetime': Field('created_datetime', datetime.datetime, required=True, read_only=True),
        'updated_datetime': Field('updated_datetime', datetime.datetime),
        'target_datetime': Field('target_datetime', datetime.datetime),
        'name': Field('name', StringType, read_only=True),
        'location': Field('location', StringType),
        'num_actions_taken': Field('num_actions_taken', IntType)
    }

    def __init__(self, **kwargs):
        self.__dict__['_in_init'] = True
        for field_name, details in self.attribute_details.iteritems():
            if details.required and field_name not in kwargs:
                raise KeyError('%s is required' % field_name)
            elif field_name in kwargs:
                self.__setattr__(field_name, kwargs[field_name])
        self.__dict__['_in_init'] = False

    def __setattr__(self, attr_name, value):
        attr_detail = self.attribute_details.get(attr_name, None)
        if not attr_detail:
            raise AttributeError('no attribute %s in object of type %s' % (attr_name, self.__class__.__name__))
        if attr_detail.read_only and not self.__dict__['_in_init']:
            raise AttributeError('%s is read-only' % attr_name)
        if type(value) is not attr_detail.type:
            raise ValueError('%s expected to be a %s' % (attr_name, attr_detail.type.__name__))
        self.__dict__['_%s' % attr_name] = value

    def __getattr__(self, attr_name):
        if attr_name not in self.attribute_details:
            raise AttributeError('no attribute "%s" in object of type %s' % (attr_name, self.__class__.__name__))
        return self.__dict__['_%s' % attr_name]
```

Not a large change so far, not scary, taking it easy... cool. Now, this frees us up to get a *leeeeetle* more creative.

### Shifting the responsibility
So, one of the core tenets of encapsulation (and, indeed, object-oriented programming as a whole) is putting
responsibility where it belongs. You wouldn't expect me to inform the DMV that I'd paid my speeding ticket at the court,
especially since every other ticket I'd paid was reported for me; that should be the court's responsibility, not mine.
(Note: in real life, shit happens. Sometimes the court doesn't tell the DMV that you'd paid a ticket and this results in
a suspension of your license. Sometimes you come across badly encapsulated code).

I digress. The point I was trying to make is that we shouldn't make `MyClass` responsible for determining if a value is
acceptable to the `Field`. Remember, `MyClass` told the `Field` object what type it should look for; we may as well make
the `Field` do something with it.

```python
class Field(object):
    def clean(self, value):
        if type(value) is not self.type:
            raise ValueError('%s expected to be a %s' % (self.name, self.type.__name__)
        return value

class MyClass(object):
    def __setattr__(self, attr_name, value):
        # check that attr_name exists
        # check if read-only
        self.__dict__['_s' % attr_name] = attr_detail.clean(value)
```
    
    
In the example, we've added a function called `clean`. Its main responsibility is to take a value, make sure that it
matches the type the `Field` object expects, raise a `ValueError` if it doesn't, and return it if it does.

Now, we're splitting up responsibilities; `MyClass` is in charge of wrangling together a bunch of fields (plus some other
functionality which we haven't yet defined and which is outside the scope of this set of articles), and the `Field`
objects will take control over what that field's value can do and can be. The two will work together to make everything
all nice and cozy.

### Getting cray-cray
So, going back to the earlier issue I raised with typing. As mentioned, I could create different classes for the types,
but that gets pretty cumbersome pretty quickly. However, now that I have a different object for a field and a function
which I call to clean up and validate the value of the field, I can shift gears. What if we give a function which knows
how to clean and validate a field to the `Field` object and then call it in the `clean` function? By this count, we can
get rid of limiting a `Field` object to a type and rely on what's called "[duck-typing](http://en.wikipedia.org/wiki/Duck_typing)".

Also, while we're at it, why not be allowed to pass a list of cleaning and/or validating functions? In our earlier
example, where we needed to see that the URL is an FTP url in the top-level-domain .net, we could have three separate
functions:

1. `assure_value_is_url`
2. `assure_url_is_ftp`
3. `assure_url_is_dot_net`

By doing this, we can mix and match the validation functions across any number of `Field`s across any number of classes
using this paradigm. Each of them is going to be pretty simple by itself, but by combining functions, you can get quite
a lot of customization!

Doing this will give us a lot of breathing room. First, I don't have to create a new object for every arbitrary value, as I
just covered. Second, we don't have to ensure the values are of the correct types wherever we're setting/constructing
`MyClass` objects; as long as we pass something which will pass validation, we should be good. Third, we can easily share
logic all over the place, not just in `Field` objects. Want to enforce that a value is a url? Run it through
`assure_value_is_url`!

Nuff talking; let's write some code. We'll be creating a new module called `validators.py` to contain all the...
validators. Next, we'll write validators for all our fields (we'll add a little logic later). Finally, we'll update the
declaration of the dictionary with all the `Field` objects. Oh, one last thing: we'll pull the `required` check into
the `Field` also; I mean, it has all the information it needs, right?

```python
# validators.py
# A collection of functions we'll use to ensure values meet certain requirements. Some notes:
# - we should make a reasonable effort to convert a bad value to a good one if 
#       a: it makes sense to do so (i.e. a uuid string -> a UUID object)
#       b: we don't lose the meaning of the object
#       c: we do so in a predictable fashion (i.e. if a value to check is None, we shouldn't create a new arbitrary value)
# - if validation is not successful, raise a ValueError
# - the function should only return the cleaned value. Returning the same value as passed in is acceptable, if it makes sense
# - functions should start with 'ensure', because we are ensuring that, given a value, we'll give back an acceptable
#   value, raising an error if it doesn't.
import datetime
import time
import uuid
from types import Type

def ensure_value_is_uuid(value):
    if type(value) is StringType:
        value = uuid.UUID(value) # this will raise ValueError if it doesn't translate to a UUID
    if type(value) is not uuid.UUID:
        raise ValueError('expected type uuid.UUID, received %s (%s)' % (value, type(value)))
    return value

def ensure_value_is_datetime(value):
    if type(value) is IntType:
        value = datetime.datetime.fromtimestamp(value) # this will raise ValueError if invalid
    elif type(value) is TimeType:
        value = datetime.datetime.fromtimestamp(value.time())
    if type(value) is not datetime.datetime:
        # I could try string types here, but it's just ridiculous to do so
        raise ValueError('expected type datetime.datetime, received %s (%s)' % (value, type(value)))

def ensure_value_is_string(value):
    return value if type(value) is StringType else str(value)

def ensure_value_is_int(value):
    return value if type(value) is IntType else int(value)

main.py
import validators as val

class Field(object):
    def __init__(self, name, clean_funcs=[], required=False, read_only=False):
        self.name = name
        self.clean_funcs = clean_funcs
        self.required = required
        self.read_only = read_only
        
    def clean(self, value):
        # reducing the array is also feasible, though less readable
        if value is None and self.required:
            raise ValueError('%s is a required field' % (self.name))
        for f in self.clean_funcs:
            value = f(value)
        return value

class MyClass:
    fields = {
        'my_uuid': Field('my_uuid', [val.ensure_value_is_uuid], required=True),
        'your_uuid': Field('your_uuid', [val.ensure_value_is_uuid], required=True),
        'uuid_a': Field('uuid_a', [val.ensure_value_is_uuid], read_only=True),
        'uuid_b': Field('uuid_b', [val.ensure_value_is_uuid], read_only=True),
        'created_datetime': Field('created_datetime', [val.ensure_value_is_datetime], required=True, read_only=True),
        'updated_datetime': Field('updated_datetime', [val.ensure_value_is_datetime]),
        'target_datetime': Field('target_datetime', [val.ensure_value_is_datetime]),
        'name': Field('name', [val.ensure_value_is_string], read_only=True),
        'location': Field('location', [val.ensure_value_is_string]),
        'num_actions_taken': Field('num_actions_taken', [val.ensure_value_is_int])
    }

    def __init__(self, **kwargs):
        self.__dict__['_in_init'] = True
        for fields in self.fields.items():
            if field.required and field.name not in kwargs:
                raise KeyError('%s is required' % field.name)
            elif field.name in kwargs:
                self.__setattr__(field.name, kwargs[field.name])
        self.__dict__['_in_init'] = False

    def __setattr__(self, attr_name, value):
        field = self.fields.get(attr_name, None)
        if not field:
            raise AttributeError('no attribute %s in object of type %s' % (attr_name, self.__class__.__name__))
        if field.read_only and not self.__dict__['_in_init']:
            raise AttributeError('%s is read-only' % attr_name)
        self.__dict__['_%s' % attr_name] = field.clean(value)

    def __getattr__(self, attr_name):
        if attr_name not in self.fields:
            raise AttributeError('no attribute "%s" in object of type %s' % (attr_name, self.__class__.__name__))
        return self.__dict__['_%s' % attr_name]
```

Man, made a few changes, added a couple abstractions, but doesn't it feel good? You may say that it's more complex than
it needs to be. It's my duty to prove to you that this is not the case. In the next installment, I'll hammer through
the rest of my requirements and demonstrate how helpful this really is. I'll also add some arbitrary limitations on the
fields, possibly adding more, to show just how easy it is to change how the validation works.

For now, however, I bid you adieu!
    

    

