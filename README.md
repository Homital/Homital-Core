# Homital-Core

[![Gitpod Ready-to-Code](https://img.shields.io/badge/Gitpod-Ready--to--Code-blue?logo=gitpod)](https://gitpod.io/#https://github.com/Homital/Homital-Core) 

The brain of homital system.

----------------------------

## Setup

This repository can be fully developed in Gitpod. To open it in Gitpod, [click here](https://gitpod.io/#https://github.com/Homital/Homital-Core).

On start up, Gitpod would automatically install all dependencies and start up a development server on port 2333, but it will certainly fail because you have to manually set the `HOMITALDB_USERNAME` and `HOMITALDB_PASSWORD` environment variables first :P

## APIs

The APIs can be accessed from http://0.0.0.0/api if in production mode and http://0.0.0.0:2333/api in development mode (change the URL accordingly).

All APIs except the ones under `/auth` require authorization (See [Authorization](#authorization)).

When the authorization of a request fails, some APIs will return `404 Not Found`.

### Authorization

Homital supports [JWT](https://jwt.io/) for authorizing API requests. Authorized requests should use an `Authorization` header with the value `Bearer <access_token>` where `<access_token>` is the JWT access token. A client app can obtain access tokens through the [App JWT Flow](#app-jwt-flow) and a device can obtain access tokens through the [Device JWT Flow](#device-jwt-flow). References for JWT can be found [here](https://jwt.io/introduction/) and [here](https://auth0.com/resources/ebooks/jwt-handbook).

#### App JWT Flow

The flow for user authorization is:

0. Register a new user
1. Request for a refresh token using user credentials
2. Request for an access token using the refresh token if the calling a secure API for the first time or the old access token has expired
3. Use the access token to make authenticated calls to secure APIs
4. Log out to nullify the refresh token

##### 0. Register A New User

```
POST /auth/user/register
```

This endpoint receives a JSON object from the request body. The JSON object includes the following fields:

Name     | Type   | Required | Description
---------|--------|----------|------------
username | String | Yes      | The username
email    | String | Yes      | The email
password | String | Yes      | The password

It will respond with a JSON object with the following fields:

Name          | Type    | Description
--------------|---------|------------
success       | Boolean | The status of the API call
error         | String  | Only present if `success==false`

##### 1. Request for A Refresh Token

```
POST /auth/user/login?by=<login_method>
```

`<login_method>` is a `String`, which can take the value of `"username"` or `"email"`.

This endpoint receives a JSON object from the request body. The JSON object includes the following fields:

Name     | Type   | Required                          | Description
---------|--------|-----------------------------------|------------
username | String | Yes if `login_method=="username"` | If `login_method=="email"`, this field will be ignored
email    | String | Yes if `login_method=="email"`    | If `login_method=="username"`, this field will be ignored
password | String | Yes                               | The password

It will respond with a JSON object with the following fields:

Name          | Type    | Description
--------------|---------|------------
success       | Boolean | The status of the API call
error         | String  | Only present if `success==false`
refresh_token | String  | The refresh token

##### 2. Request for An Access Token

```
POST /auth/user/token
```

This endpoint receives a JSON object from the request body. The JSON object includes the following fields:

Name  | Type   | Required | Description
------|--------|----------|------------
token | String | Yes      | The refresh token

The server will respond with a JSON object with the following fields:

Name          | Type    | Description
--------------|---------|------------
success       | Boolean | The status of the API call
error         | String  | Only present if `success==false`
access_token  | String  | The access token

##### 3. Make Authenticated API Calls

To access secure APIs, include the following into the request header, where `<access_token>` is the access token received in [Request for An Access Token](#2-request-for-an-access-token)

```
Authorization: Bearer <access_token>
```

##### 4. Nullify Refresh Token

```
DELETE /auth/user/logout
```

This endpoint receives a JSON object from the request body. The JSON object includes the following fields:

Name  | Type   | Required | Description
------|--------|----------|------------
token | String | Yes      | The refresh token

The server will respond with a JSON object with the following fields:

Name          | Type    | Description
--------------|---------|------------
success       | Boolean | The status of the API call
error         | String  | Only present if `success==false`

#### Device JWT Flow

Todo...

### Users

#### List users (deprecated, will be removed in stable version)

```
GET /user
```

#### List rooms for a user

```
GET /user/:username/rooms
```

#### List devices for a user

```
GET /user/:username/devices
```

#### List devices in a room

```
GET /user/:username/:roomname/devices
```

#### Get the state of a device

```
GET /user/:username/:roomname/:devicename
```

#### List available actions for a device

```
GET /user/:username/:roomname/:devicename/actions
```

#### Fire an action for a device

```
POST /user/:username/:roomname/:devicename/:actionname
```

#### Devices
