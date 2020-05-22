# Homital-Core

[![Gitpod Ready-to-Code](https://img.shields.io/badge/Gitpod-Ready--to--Code-blue?logo=gitpod)](https://gitpod.io/#https://github.com/Homital/Homital-Core) 

The brain of homital system.

----------------------------

## Setup

This repository can be fully developed in Gitpod. To open it in Gitpod, [click here](https://gitpod.io/#https://github.com/Homital/Homital-Core).

On start up, Gitpod would automatically install all dependencies and start up a development server on port 2333.

## List of APIs

The APIs can be accessed from http://0.0.0.0/api if in production mode and http://0.0.0.0:2333/api in development mode (change the URL accordingly).

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