A simple desktop client for playing Dungeons and Dragons online with friends.
  
The client provides character-sheets, automatically fetches spell descriptions and provides a small browser, meaning don't have to tab out of the program if you want to look at a wiki entry or something.
  
It is also capable of tracking and synchronizing initiative for the entire party as well as bad guys, has super simple session management and allows the dungeon master to load a battle map for everyone at the same time!
  
Since the client does not provide a VTT but instead relies on you to bring one, you can just take your favorite tools to the next level instead of learning a completely new VTT!

# Windows
Just download and run the installer linked in the latest release!

The client will automatically update itself

# Linux
You can either download the AppImage linked in the latest release or get the client via snap: https://snapcraft.io/dnd-client

`sudo snap install dnd-client --edge`

Both versions will automatically update themselves

# MacOS
MacOS isn't officialy supported but you can try building it yourself, see [Build it yourself](https://github.com/DeinAlbtraumTV/DnD-Client/edit/master/Readme.md#build-it-yourself)
Since MacOS isn't supported, automatic updates will not work.

You might encounter various issues with running the client on MacOS. Please report them and i will try to fix them, but consider MacOS highly experimental

# Build it yourself
Building the client yourself is quite simple as well:
1. Make sure you have Node 20 and Yarn installed
2. Clone the repo `git clone https://github.com/DeinAlbtraumTV/DnD-Client.git`
3. Enter the directory `cd DnD-Client`
4. Install the dependencies `yarn install`
5. Build the client `yarn run electron-pack`

Build output will be under the dist directory

If you wish to disable automatic updates you need to patch the index.js file under the client folder. Simply change `DISABLE_AUTOMATIC_UPDATES` to true
