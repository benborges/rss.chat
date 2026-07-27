# rss.chat
A simple chat network, client and server, based on RSS 2.0 feeds and websockets.

This is a fork. The `federation` branch adds cross-instance conversations: an
operator lists other instances in `federatedServers`, their posts appear in the
timeline tagged with where they came from, and you can reply to them -- a reply
is an ordinary post on your own server that points back at the remote one by its
permalink, carried in `source:inReplyTo` like any other reply. Nobody needs an
account on anybody else's instance. See
[config.md](server/docs/config.md#federatedservers) for the setting, and the
`Federation:` commits for the change itself.

### A note on source.opml

Upstream is written in an outliner, and the `.js` files are generated from
`source.opml` -- that file is the real source there, which is why Dave's own
comment at the top of it invites you to open it in [Drummer](https://drummer.land/).

On this branch that is the other way around. The federation work was written
directly in `client/code/themes/classic/theme.js`, `client/code/api.js` and
`server/code/rssnetwork.js`, and the two `source.opml` files were left alone --
they still describe the code as it was before federation. Read the `.js`, not
the outline.

Two things follow. If you regenerate the `.js` files from `source.opml`, the
federation work disappears -- don't. And if any of this is ever wanted upstream,
it can't be merged mechanically into an outliner-generated project; it would have
to be re-entered there, so the diff is offered as something to read and decide
about, not as a pull request expecting a merge button.
