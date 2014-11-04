package netflix.nebula.interactive

import com.fasterxml.jackson.databind.ObjectMapper
import io.reactivex.netty.RxNetty
import io.reactivex.netty.protocol.http.server.HttpServerRequest
import io.reactivex.netty.protocol.http.server.HttpServerResponse
import io.reactivex.netty.protocol.http.server.RequestHandler
import io.reactivex.netty.protocol.http.server.RequestHandlerWithErrorMapper
import io.reactivex.netty.protocol.http.server.file.ClassPathFileRequestHandler
import io.reactivex.netty.protocol.http.server.file.FileErrorResponseMapper

import java.util.concurrent.CountDownLatch

println 'starting server...'

def latch = new CountDownLatch(1)

final def server = RxNetty.createHttpServer(8641,
    new HttpRouter()
        .get('/dependencies', { HttpServerRequest request, HttpServerResponse response ->
            response.writeString(new ObjectMapper().writeValueAsString([
                nodes: [
                    [org:'org.springframework', name: 'spring-tx', version: '4.0.1', index: 0],
                    [org:'org.springframework', name: 'spring-core', version: '4.0.1', index: 1]
                ],
                links: [
                    [source: 0, target: 1]
                ]
            ]))
            response.close()
        } as RequestHandler)
        .getWithRegEx('/static.*', RequestHandlerWithErrorMapper.from(
            new ClassPathFileRequestHandler('.'),
            new FileErrorResponseMapper())
        )
).start()

latch.await()
server.shutdown()