# test-bot

station pattern:
{
	"url": "stream url",
	"desc": "description that will be displayed",
	"shortname": "one word identifying station"
}
ALWAYS ADD A COMMA AFTER PREVIOUS STATION!!!

message pattern:

    if (message.content.toLowerCase().includes("message")) {
        message.channel.send("reply")
    }

for exact message:
    if (message.content.toLowerCase() === "message")) {
        message.channel.send("reply")
    }
