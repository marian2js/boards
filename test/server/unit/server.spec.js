const http = require('http');
const server = require('server/server');

describe('Server', () => {

  describe('start', () => {
    let app;
    let httpServer;

    beforeEach(() => {
      app = {
        set: () => {}
      };
      httpServer = {
        listen: () => {},
        on: (val, cb) => {
          if (val === 'listening') {
            cb();
          }
        }
      };
      spyOn(app, 'set').and.callThrough();
      spyOn(http, 'createServer').and.returnValue(httpServer);
      spyOn(httpServer, 'listen').and.callThrough();
      spyOn(httpServer, 'on').and.callThrough();
    });

    it('should configure the http server', done => {
      server.start(app)
        .then(() => {
          expect(server.httpServer.listen).toHaveBeenCalledWith(4000);
          expect(server.httpServer.on).toHaveBeenCalledWith('listening', jasmine.any(Function));
          expect(server.httpServer.on).toHaveBeenCalledWith('error', jasmine.any(Function));
          done();
        })
        .catch(err => done.fail(err));
    });

    it('should set the port on the app', done => {
      server.start(app)
        .then(() => {
          expect(server.port).toBe(4000);
          done();
        })
        .catch(err => done.fail(err));
    });

    it('should set the http server on the app', done => {
      server.start(app)
        .then(() => {
          expect(server.httpServer).toBe(httpServer);
          done();
        })
        .catch(err => done.fail(err));
    });
  });

});