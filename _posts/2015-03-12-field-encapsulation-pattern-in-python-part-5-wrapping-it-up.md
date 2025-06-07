---
title: Field encapsulation pattern in Python, part 5 - Wrapping it up
date: 2015-03-12
category: Software
tags:
- python
- getter/setter
- pattern
- encapsulation
- __setattr__
- __getattr__
---

We're here! To now, we've come through [part 1]({{ site.baseurl }}{% link _posts/2015-02-28-field-encapsulation-pattern-in-python-part-1-getters-and-setters.md %}), [part 2]({{ site.baseurl }}{% link _posts/2015-03-03-field-encapsulation-pattern-in-python-part-2-setattr-and-getattr.md %}), [part 3]({{ site.baseurl }}{% link _posts/2015-03-05-field-encapsulation-pattern-in-python-part-3-required-and-readonly.md %}), and [part 4]({{ site.baseurl }}{% link _posts/2015-03-07-field-encapsulation-pattern-in-python-part-4-field-objects.md %}), and now
we're ready to wrap it up. So, without further ado, the conclusion to the Field encapsulation pattern!

### Where are we?
At this point, we have field objects, we have validation functions, have required, we have read-only. What's left? Flashing
back to the requirements, we need a serializable representation and a default value. Let's throw those in!

### Serialization fun
I use json. A lot. It's cross-platform, easy (enough) to read, has far less bloat than XML, and is overall an enjoyable
serialized representation. Because of its popularity, most modern languages have a package for serializing to and
deserializing from json; Python is [no different](https://docs.python.org/2/library/json.html). However, one of the problems is that non-native objects (at
least in Python) can have a hard time being serialized into a json representation. Therefore, since I'll be using the
json serializer, I'll need to have some way to create a json representation for the value of any given field.

In our example, we have a couple types which will need to have a different representation: ```UUID``` and ```datetime```.
To demonstrate: 

```python
>>> u = uuid.uuid4()
>>> u
UUID('65cfe731-098f-4ab5-bca2-db48dff2c507')
>>> import json
>>> a = json.dumps(u)
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
  File "/System/Library/Frameworks/Python.framework/Versions/2.7/lib/python2.7/json/__init__.py", line 243, in dumps
    return _default_encoder.encode(obj)
  File "/System/Library/Frameworks/Python.framework/Versions/2.7/lib/python2.7/json/encoder.py", line 207, in encode
    chunks = self.iterencode(o, _one_shot=True)
  File "/System/Library/Frameworks/Python.framework/Versions/2.7/lib/python2.7/json/encoder.py", line 270, in iterencode
    return _iterencode(o, 0)
  File "/System/Library/Frameworks/Python.framework/Versions/2.7/lib/python2.7/json/encoder.py", line 184, in default
    raise TypeError(repr(o) + " is not JSON serializable")
TypeError: UUID('65cfe731-098f-4ab5-bca2-db48dff2c507') is not JSON serializable
```

But, if you'll recall, our validation/cleaning functions will accept a string representation of a ```UUID``` like this:

```python
>>> s = '65cfe731-098f-4ab5-bca2-db48dff2c507'
>>> u = uuid.UUID(s)
>>> u
UUID('65cfe731-098f-4ab5-bca2-db48dff2c507')
```

OK, we'll just take a string represenation for our json object. Of course, we don't want to have to manually encode this,
so let's put this on the Field object:
 
```python
class Field(object):
    def __init__(self, name, clean_funcs=[], required=False, read_only=False, dict_repr_func=None):
        self.dict_repr_func = dict_repr_func
        ...
        
    def dict_repr(self, value):
        return value if not self.dict_repr_func else self.dict_repr_func(value)

class MyClass(object):
    fields = {
        'my_uuid': Field('my_uuid', [val.ensure_value_is_uuid], required=True, dict_repr_func=str),
        'your_uuid': Field('your_uuid', [val.ensure_value_is_uuid], required=True, dict_repr_func=str)
        ...
```

Now, we can approach getting a json-encoded string of this object a couple different ways. One way, the way I like, is
to have a ```to_json()``` method on ```MyClass```:

```python
class MyClass(object):
    ...
    def to_json(self):
        json_dict = {}
        for field in self.fields.items():
            json_dict[field.name] = field.dict_repr(getattr(self, field.name))
        return json.dumps(json_dict)

mc = MyClass(some_data)
s = mc.to_json()
```

There we go! Now, we just have to make sure that for all objects, we do this same thing. The next one on our list is
going to be the ```datetime``` objects; those take a custom function. Since we can create a proper value from an ```int```,
we'll use an ```int``` as our serialized representation:

```python
def convert_datetime_to_epoch_seconds(dt):
    if dt is None:
        return None
    epoch = datetime.datetime(1970,1,1)
    return int((dt - epoch).total_seconds())

class MyClass(object):
    fields = {
        ...
        'created_datetime': Field('created_datetime', [val.ensure_value_is_datetime], required=True, read_only=True, dict_repr_func=convert_datetime_to_epoch_seconds),
        'updated_datetime': Field('updated_datetime', [val.ensure_value_is_datetime], dict_repr_func=convert_datetime_to_epoch_seconds)
        ...
    }
```

### Moar duplication!
Okay, so you may have noticed that I'm duplicating some code. Not much, but I'm duplicating the ```clean_funcs``` and the
```dict_repr_funcs``` in each type. I don't like that duplication, even if it's a little bit as it is in this case.
Therefore, let's change it!

I'm going to create typed fields. For instance:

```python
import validators as val
class UUIDField(Field):
    default_clean_funcs = [val.ensure_value_is_uuid]
    default_dict_repr_func = str
    
    def __init__(self, *args, **kwargs):
        kwargs['clean_funcs'] = default_clean_funcs + (kwargs['clean_funcs'] if 'clean_func' in kwargs else [])
        kwargs['dict_repr_func'] = kwargs['dict_repr_func'] if 'dict_repr_func' in kwargs else default_dict_repr_func
        super(UUIDField, self).__init__(*args, **kwargs)
```

What this does is injects the defaults (which we've used whenever defining instances of the Fields before) into the
constructor, taking the onus off of us. Now, we only have to be aware of special cases, not of common cases. Great!
Let's do the same for ```datetime```:

```python
import validators as val
class DatetimeField(Field):
    default_clean_funcs = [val.ensure_value_is_datetime]
    default_dict_repr_func = convert_datetime_to_epoch_seconds
    
    def __init__(self, *args, **kwargs):
        kwargs['clean_funcs'] = default_clean_funcs + (kwargs['clean_funcs'] if 'clean_func' in kwargs else [])
        kwargs['dict_repr_func'] = kwargs['dict_repr_func'] if 'dict_repr_func' in kwargs else default_dict_repr_func
        super(DatetimeField, self).__init__(*args, **kwargs)
```

Whoooops! More duplication! Let's just pull the ```__init__``` changes into the parent ```Field``` class

```python
    class Field(object):
        default_clean_funcs = []
        default_dict_repr_func = None
        
        def __init__(self, name, clean_funcs=[], required=False, read_only=False, dict_repr_func=None):
            self.name = name
            self.clean_funcs = self.default_clean_funcs + clean_funcs
            self.required = required
            self.read_only = read_only
            self.dict_repr_func = dict_repr_func if dict_repr_func else default_dict_repr_func
```

And we can get rid of the ```__init__``` override in the child classes. Now, we need to apply the changes to ```MyClass```:

```python
class MyClass(object):
    fields = {
        'my_uuid': UUIDField('my_uuid', required=True),
        'your_uuid': UUIDField('your_uuid', required=True),
        'uuid_a': UUIDField('uuid_a', read_only=True),
        'uuid_b': UUIDField('uuid_b', read_only=True),
        'created_datetime': DatetimeField('created_datetime', required=True, read_only=True),
        'updated_datetime': DatetimeField('updated_datetime'),
        'target_datetime': DatetimeField('target_datetime'),
        'name': Field('name', [val.ensure_value_is_string], read_only=True),
        'location': Field('location', [val.ensure_value_is_string]),
        'num_actions_taken': Field('num_actions_taken', [val.ensure_value_is_int])
    }
```

Much better! We can add all sorts of different types of fields, but one thing I would caution against is fragmenting
types too much and really only add them when you have fairly specialized logic you need the ```Field``` object to do.
Were it me, I'd err on the side of using more generic ```Field```s and more explicit ```dict_repr_func``` and
```clean_func``` assignments.

### So, will this fix our json problem?
Yes! We're done with that. Woo!

### How about defaults?
Well, having seen the pattern I've been doing, what do you think is next?

...

Yup, that's right! Define the default where you use the ```Field``` on ```MyClass```! Then, when you're doing the
```clean``` operation, you can apply the default if nothing has been assigned. easy peasy! That implementation will 
end up looking like this (assuming the attribute ```num_actions_taken``` defaults to 1):

```python
class Field(object):
    def __init__(self, name, clean_funcs=[], required=False, read_only=False, dict_repr_func=None, default=None):
        ...
        self.default = default
    
    ...
    
    def clean(self, value):
        # I like putting the default fetching at the top; adds just a little bit of safety in case I typed
        # in the default value wrong
        if value is None and self.default:
            value = self.default
        if value is None and self.required:
            raise ValueError('%s is a required field' % (self.name))
        for f in self.clean_funcs:
            value = f(value)
        return value

class MyClass(object):
    fields = {
        ...
        'num_actions_taken': Field('num_actions_taken', [val.ensure_value_is_int], default=1)
```

Voila! We now have default values! And that simplicity is why I love using the ```Field``` pattern I've described above;
it's very easy to modify, extend, and customize.

### In conclusion
First, let's take a look at our final class representation:

```python
import datetime, json, uuid
from types import *

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
    
def convert_datetime_to_epoch_seconds(dt):
    if dt is None:
        return None
    epoch = datetime.datetime(1970,1,1)
    return int((dt - epoch).total_seconds())
    

class Field(object):
    default_clean_funcs = []
    default_dict_repr_func = None
    
    def __init__(self, name, clean_funcs=[], required=False, read_only=False, dict_repr_func=None, default=None):
        self.name = name
        self.clean_funcs = self.default_clean_funcs + clean_funcs
        self.required = required
        self.read_only = read_only
        self.dict_repr_func = dict_repr_func if dict_repr_func else self.default_dict_repr_func
        self.default = default
        
    def clean(self, value):
        # in the default value wrong
        if value is None and self.default:
            value = self.default
        if value is None and self.required:
            raise ValueError('%s is a required field' % (self.name))
        for f in self.clean_funcs:
            value = f(value)
        return value
        
    def dict_repr(self, value):
        return value if not self.dict_repr_func else self.dict_repr_func(value)

class DatetimeField(Field):
    default_clean_funcs = [val.ensure_value_is_datetime]
    default_dict_repr_func = convert_datetime_to_epoch_seconds

class UUIDField(Field):
    default_clean_funcs = [val.ensure_value_is_uuid]
    default_dict_repr_func = str
    

class MyClass:
    fields = {
        'my_uuid': UUIDField('my_uuid', required=True),
        'your_uuid': UUIDField('your_uuid', required=True),
        'uuid_a': UUIDField('uuid_a', read_only=True),
        'uuid_b': UUIDField('uuid_b', read_only=True),
        'created_datetime': DatetimeField('created_datetime', required=True, read_only=True),
        'updated_datetime': DatetimeField('updated_datetime'),
        'target_datetime': DatetimeField('target_datetime'),
        'name': Field('name', [val.ensure_value_is_string], read_only=True),
        'location': Field('location', [val.ensure_value_is_string]),
        'num_actions_taken': Field('num_actions_taken', [val.ensure_value_is_int], default=1)
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
        
    def to_json(self):
        json_dict = {}
        for field in self.fields.items():
            json_dict[field.name] = field.dict_repr(getattr(self, field.name))
        return json.dumps(json_dict)
```

I suppose that seems like a lot of code, but for everything we're getting, this really is pretty concise. Let's review
everything which this allows:

    1. Mark an attribute as required
    2. Mark an attribute as read-only
    3. Allow an unlimited number of validation rules as long as you can represent them in a function which a) accepts the
       value to validate as a sole input and b) returns the cleaned value
    4. Allow mixing and matching of arbitrary validation rules, as long as the above is met.
    4. Allow custom ways to represent values of attributes in a json-representation
    5. Allow per-attribute instances of each of these; they're not defined by the field type
    6. Allow adding ALL of this with as little as one line of code for a new attribute
    7. No more boilerplate code in the form of setters/getters and things of that nature.
    8. As long as the rules are set up properly, we have a contract: a value in this attribute will be of a certain type.

So, that's... a lot. I'm happy with all that for a relatively small amount of code!

Any rate, that about wraps up my series on this field encapsulation pattern in Python. Hopefully, this demonstrates what
you can do with a dynamic language with no typing or real encapsulation if you put your mind to it!

Also new with today's post: Facebook comments! Now you can let me know what you think about my posts! And I would love
to hear what you thought of this series... or anything in general. Please let me know!
    

    

