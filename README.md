# Unicode Search

This is a simple Electron app that lets you search for characters,
by name, by character, or by code point, and see useful information
about them. It also builds a command-line app with much the same
functionality, and a self-contained web page that you can put wherever
you like such as a corporate intranet.

Most of the code is not Electron-specific.

Unicode character data comes from the Unicode consoritum's web site at
https://unicode.org/Public/UNIDATA/UnicodeData.txt and is downloaded
when needed for local development or builds.

# Installation / Development

You will need `node` and `npm` installed.

Install dependencies:

- make deps

Delete old build artifacts

-make clean

Run the Electron app in development:

- npm start

Build the packaged app, standalone CLI artifact, and standalone web page:

- make build

Build just the standalone CLI artifact:

- make cli

Build just the standalone web page:

- make web

Regenerate the Electron app icon assets from the SVG source:

- make icon

Run the CLI directly:

- out/unicode-search <characters>

Open the standalone web build directly in a browser:

- open out/unicode-search.html

Run tests:

- npm test

`npm test` exercises the shared Unicode logic, the standalone CLI build,
the standalone web page in Chromium/Firefox/WebKit,
and the Electron app render path.

Run linting:

- npm run lint

If you are on a Mac and have a `$HOME/bin` then you can:

- make install

# Contributing

Patches and bug reports are most welcome. Please raise them on
Github. Feature requests are far more likely to be implemented
by *you* than by me.

# Licence

GNU General Public Licence version 2.0, see the `LICENCE` file.

# Screenshots

![Pretty Electron app](https://github.com/user-attachments/assets/c3233d85-71ef-4432-96f1-17ff1e252a09)

![Better CLI version](https://github.com/user-attachments/assets/56cdafda-b45f-4826-bfc2-86aaa3414850)
