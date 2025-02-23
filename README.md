# Unicode Search

This is a simple Electron app that lets you search for characters,
by name, by character, or by code point, and see useful information
about them.

Most of the code is, of course, not Electron-specific, and it will
also build a CLI version which I think is much more useful.

# Installation / Development

You will need make(1), a C pre-processer, `wget`, `node` and `npm` installed.
If you are on Linux then you will need `rpm` even if you're not using Redhat,
because of [a bug in Electron](https://github.com/electron/forge/issues/3772).

To install Electron and all its jibber-jabber:

- make deps

To build it:

- make build

then look in the `out` directory for your platform's favourite
flavour of executable.

Or you can `make dev` to run it in dev mode.

To clear out auto-generated files and built artifacts, `make clean`.

If you are on a Mac and have a `$HOME/bin` then you can:

- make install

# Contributing

Patches and bug reports are most welcome. Please raise them on
Github. Feature requests are far more likely to be implemented
by *you* than by me.

I would especially welcome help with the following:

- Making it pretty
- CI stuff to build releases for all platforms

# Licence

GNU General Public Licence version 2.0, see the `LICENCE` file.

# Screenshots

![Pretty Electron app](https://github.com/user-attachments/assets/c3233d85-71ef-4432-96f1-17ff1e252a09)

![Better CLI version](https://github.com/user-attachments/assets/56cdafda-b45f-4826-bfc2-86aaa3414850)
