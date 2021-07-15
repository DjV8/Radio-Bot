function stop(queue) {
  queue.media = [];
  queue.connection.dispatcher.end();
}
export default stop;
