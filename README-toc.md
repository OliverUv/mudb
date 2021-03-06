mudb
=====
`hudb` is a client-server data base for multiplayer games on the web.

It makes networked game programming fun and simple.

**TODO INSERT VIDEO LIVE CODING DEMO**

[TypeScript](https://www.typescriptlang.org/) friendly, works great with [nodejs](https://nodejs.org).

**UNDER CONSTRUCTION**

# table of contents

# modules #
`mudb` is implemented as a collection of modules, each of which solves a particular problem related to networked game programming.  They work great together, but you can also use them individually in other projects.

## [mudb](https://github.com/mikolalysenko/mudb/tree/master/mudb)
[`mudb`](https://github.com/mikolalysenko/mudb/tree/master/mudb) is the database itself.  For users learning the API, start here after reading about concepts.

## [muschema](https://github.com/mikolalysenko/mudb/tree/master/muschema)
[`mudb`](https://github.com/mikolalysenko/mudb/tree/master/mudb) is used to define the database schema.

## [munet](https://github.com/mikolalysenko/mudb/tree/master/munet)
[munet](https://github.com/mikolalysenko/mudb/tree/master/munet) is a socket/server abstraction over websockets, web workers, timeouts and other transports.  You can use it to emulate different network conditions, log and replay events, and set up different testing scenarios.

# big picture concepts #
`mudb` solves networking problems by providing 2 generic types of communication:

* **Active replication** or message passing
* **Passive replication** or state synchronization

It does this over a generic network interface that abstracts websockets, webrtc, local servers, workers and more.  All network information is serlialized using *schemas* which are specified via `muschema`.  

## messages ##
[Message passing](FIXME) is the basic building block for communication in a distributed system.  `mudb` provides a [reliable, ordered message delivery](FIXME) for intermittent communication.  This can be used to implement [active replication](FIXME) to synchronize larger objects (where state replicaiton would be too expensive) or to authenticate transactions.

`mudb` provides two types of reliable message passing:

* **[Remote procedure calls or RPC](FIXME)**: procedure which returns some value asynchronously
* **Messages**: One shot events with no returned data

The practical difference between RPC and messages is that the server can broadcast messages to multiple clients.

## state replication ##
In addition to message passing, `mudb` supports passive state replication.  This is necessary for numerical quantities like position or velocity in physical simulations, where one can not expect reasonably that all nodes implement some numerical operation the same way.  

`mudb` uses delta encoding to minimize bandwidth usage.  In order for this to work it must buffer some number of past state observations.  The number of these states which are stored can be configured to be arbitrarily large, and are visible to the user.  This can be useful when implementing different types of latency hiding techniques like local perception filters.  It also makes it easier to decouple rendering from state updates.

## abstract sockets ##
`mudb` communicates over a generic socket abstraction provided by `munet`.  `munet` sockets support both reliable and unreliable delivery.  Unreliable delivery is used for state replication, while reliable delivery is used for messages.  Unreliable delivery is generally faster than reliable delivery since it does not suffer from head-of-line blocking problems.  For websocket servers, `munet` emulates unreliable delivery using multiple websocket connections.

## schemas ##
A schema is a type declaration for the interface between the client and server. Schemas in `mudb` are specified using the `muschema` module.  Like [protocol buffers](FIXME) or [gRPC](FIXME), `muschema` uses binary serialized messages with a defined schema and makes extensive use of code generation. However, `mudb` departs from these systems in 3 important ways:

* **Javascript only** Unlike protocol buffers, `muschema` has no aspirations of ever being cross-language.  However, it does make it much easier to extend `mudb` to support direct serialization of custom application specific data structures.  For example, you could store all of your objects in an octree and apply a custom schema to directly diff this octree into your own data type.
* **0-copy delta encoding** `muschema` performs all serialization as a relative `diff` operation.  This means that messages and state changes can be encoded as changes relative to some observed reference.  Using relative state changes greatly reduces the amount of bandwidth required to replicate a given change set
* **Memory pools** JavaScript is a garbage collected language, and creating patched versions of different messages can generate many temporary objects.  In order to avoid needless and wasteful GC thrashing, `muschema` provides a pooling interface and custom memory allocator.

## further reading ##

Light reading:

* protocol buffers
* [quake 3](http://fabiensanglard.net/quake3/network.php)
* "[Planetary Annihilation](https://blog.forrestthewoods.com/the-tech-of-planetary-annihilation-chronocam-292e3d6b169a)"
* [Janus](http://equis.cs.queensu.ca/wiki/index.php/Janus)
* "[Implementation of Rewind in Braid](https://www.youtube.com/watch?v=8dinUbg2h70)"
* "[Relativistic replication](https://mikolalysenko.github.io/nodeconfeu2014-slides/index.html#/)"
* "[Source multiplayer networking](https://developer.valvesoftware.com/wiki/Source_Multiplayer_Networking)"

Academic references:

* C. Savery, T.C. Graham, "[Timelines: Simplifying the programming of lag compensation for the next generation of networked games](https://link.springer.com/article/10.1007/s00530-012-0271-3)" 2013
* Local perception filters
* **TODO**

# examples #

**TODO**

# developing #

**TODO**

* Environment set up
    * typescript
    * vs vode
    * npm/node
    * linking
* tests
    * running
    * writing
* code style
* code of condunct

# TODO

## Planned features:

* thorough documentation
* delta based state replication
* 0-copy binary serialization
* 0-gc pooled memory management
* in-browser server emulation
* multiple network transports
* local network simulation
* tracing and playback
* quick start development server

## Deliberately missing features:

* Lobby server
* Match making
* Login/identity management
* Session management
* Region of interest management
* Fully peer-to-peer networking
* Cross language support (100% JavaScript/TypeScript)
* Cryptographic security is deferred to transport layer

## Examples wanted

* Chat room
* Moving dots
* Capture the flag
* Asteroids
* Pong
* Tetris

## Development tasks

* Think through security implications
* Debug serialization
* Race condition hunt

# credits
Development supported by Shenzhen DianMao Digital Technology Co., Ltd.

<img src="img/logo.png" />

Written in Shenzhen, China.

(c) 2017 Mikola Lysenko, Shenzhen DianMao Digital Technology Co., Ltd.
