# Homital-Core

The brain of homital system.

----------------------------

## List of APIs

The APIs can be accessed from http://homital.ml/api.

### List users

```
GET /users
```

### List rooms for a user

```
GET /users/:username/rooms
```

### List devices for a user

```
GET /users/:username/devices
```

### List devices in a room

```
GET /users/:username/:roomname/devices
```

### Get the state of a device

```
GET /users/:username/:roomname/:devicename
```

### List available actions for a device

```
GET /users/:username/:roomname/:devicename/actions
```

### Fire an action for a device

```
POST /users/:username/:roomname/:devicename/:actionname
```

### 