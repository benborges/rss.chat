//getthread -- fetch a whole rss.chat conversation with one API call, and print it as an indented outline.
	//An example app from the rss.chat repo: https://github.com/scripting/rss.chat/tree/main/examples/getthread
	//Same output as the threadwalker example, which assembles the thread from the RSS feeds alone --
	//this is the other door: one call to /getthread and the server hands you the tree.

const https = require ("https");
const http = require ("http");

var urlPost = "https://rss.chat/?id=204"; //the post to start from -- its guid, which is its permalink
if (process.argv [2] !== undefined) {
	urlPost = process.argv [2];
	}

const theServer = new URL (urlPost).origin; //the API lives on the server the post lives on
const urlApiCall = theServer + "/getthread?guid=" + encodeURIComponent (urlPost);
const theProtocol = (theServer.indexOf ("https:") === 0) ? https : http;

theProtocol.get (urlApiCall, function (response) {
	var body = "";
	response.on ("data", function (chunk) {
		body += chunk;
		});
	response.on ("end", function () {
		if (response.statusCode !== 200) {
			console.log (body); //the server explains what went wrong in a plain sentence
			return;
			}
		var thread;
		try {
			thread = JSON.parse (body);
			}
		catch (err) {
			console.log ("Can't read the response because it isn't JSON. " + err.message);
			return;
			}
		printItem (thread, 0);
		});
	}).on ("error", function (err) {
		console.log (err.message);
		});

function printItem (item, indentlevel) {
	var theText = item.description;
	if (item.markdowntext !== undefined) {
		theText = item.markdowntext;
		}
	console.log ("\t".repeat (indentlevel) + item.author + ": " + theText.split ("\n") [0]);
	(item.replies || []).forEach (function (reply) {
		printItem (reply, indentlevel + 1);
		});
	}
