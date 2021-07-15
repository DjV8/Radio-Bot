function skip(queue) {
  if (queue.loop === 'loop') queue.media.shift();
  queue.connection.dispatcher.end();
}
export default skip;
