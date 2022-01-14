# DnD-Client

A small program i wrote for playing D&D with my friends.

**The Client is still in an early alpha, so there will be breaking changes very often!**

## Features
- Sessions, allowing you and your friends to play without interruption
- Initiative Tracker (WIP), allowing you to keep track of whos turn it is
- VTT support so you don´t have to learn the controls of a new vtt and import all of your stuff
- Spell-wiki. Available by double-clicking on the name of a spell, the client will try to fetch the description of the spell, removing the need for 20+ browser tabs
- Import your character-sheets with the click of a button, so you don´t have to copy-paste all of that 10+ page long backstory yourself
- Healthbars to quickly visualize how much health you got left (currently excludes temporary hp)
- Saves your character sheets once you finish editing, preventing data-loss
- Persistent sessions, meaning the client will try to recover the last session (this may not work if glitch stopped the server in the mean time)
- Discord rich presence

## DM specific features
- Quickly view the character sheets of your players
- Healthbars for every player, allowing you to see your players suffer more easily
- Quickly re-arrange the initiative tracker via drag and drop and cycle to the next player with the click of a button

## Info
- This Client is developed by a single person in their free time, so please don´t expect me to reply to issues instantly
- The Client is still in alpha, issues such as desyncs will happen and i am working on them
- **The Client is still in an early alpha, so there will be breaking changes very often!**
- The code for the server is made public in a [second repository](https://github.com/DeinAlbtraumTV/DnD-Server) and currently hosted on glitch (this will very likely change in the future because of persistent sessions)
- I am open to suggestions, so if you want to see a feature in the client feel free to open an issue
- If you encounter an error, please check the faq below first and if it doesn´t help feel free to open an issue

## FAQ
- Help, something is not working correctly!
  - Please make sure you are on the newest version of the client and proceed to look below. Otherwise please upgrade as only the latest version will work like expected due to breaking changes on the server
- I encountered a desync
  - Things like this may happen, try strg + r to reload the client. Initiative tokens should persist, however the dm will need to become dm again as well as loading in the map
  - The above should be done by the dm first, then once by the affected clients
- The problem i am having is not listed above
  - Feel free to open an issue
