package netflix.nebula.interactive

import com.netflix.karyon.transport.http.SimpleUriRouter
import io.netty.handler.logging.LogLevel
import io.reactivex.netty.RxNetty
import io.reactivex.netty.protocol.http.server.HttpServerRequest
import io.reactivex.netty.protocol.http.server.HttpServerResponse
import io.reactivex.netty.protocol.http.server.RequestHandler
import io.reactivex.netty.protocol.http.server.RequestHandlerWithErrorMapper
import io.reactivex.netty.protocol.http.server.file.ClassPathFileRequestHandler
import io.reactivex.netty.protocol.http.server.file.FileErrorResponseMapper

import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

println 'starting server...'

def latch = new CountDownLatch(1)

final def server = RxNetty.createHttpServer(8641,
    new SimpleUriRouter()
        .addUri('/dependencies', { HttpServerRequest request, HttpServerResponse response ->
            String conf = request.queryParameters['conf'] ?: 'compile'
            response.writeString(conf)
            latch.countDown()
            response.close()
        } as RequestHandler)
        .addUri('/static/*', RequestHandlerWithErrorMapper.from(
                new ClassPathFileRequestHandler('.'),
                new FileErrorResponseMapper())
        )
).start()

latch.await(10, TimeUnit.SECONDS)
server.shutdown()