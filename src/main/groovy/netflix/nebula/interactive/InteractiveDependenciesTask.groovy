package netflix.nebula.interactive

import com.fasterxml.jackson.databind.ObjectMapper
import com.netflix.karyon.transport.http.SimpleUriRouter
import groovy.transform.Canonical
import groovy.transform.EqualsAndHashCode
import groovy.transform.TailRecursive
import io.reactivex.netty.RxNetty
import io.reactivex.netty.protocol.http.server.HttpServerRequest
import io.reactivex.netty.protocol.http.server.HttpServerResponse
import io.reactivex.netty.protocol.http.server.RequestHandler
import io.reactivex.netty.protocol.http.server.RequestHandlerWithErrorMapper
import io.reactivex.netty.protocol.http.server.file.ClassPathFileRequestHandler
import io.reactivex.netty.protocol.http.server.file.FileErrorResponseMapper
import org.gradle.api.DefaultTask
import org.gradle.api.artifacts.ResolvedDependency
import org.gradle.api.tasks.TaskAction

import java.awt.Desktop
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

class InteractiveDependenciesTask extends DefaultTask {
    private final int PORT = 8641

    @Canonical
    @EqualsAndHashCode(excludes = 'index')
    class Artifact {
        String org
        String name
        String version
        int index
    }

    @TailRecursive
    def recurseDependencies(Map results, int index, Set<ResolvedDependency> deps) {
        int parentIndex = index
        def allChildren = new HashSet();
        deps.each { dep ->
            results.nodes.add(new Artifact(dep.moduleGroup, dep.moduleName, dep.moduleVersion, index++))
            results.links.add([source: parentIndex, target: index])
            allChildren.addAll(dep.children)
        }
        if(!allChildren.empty)
            return recurseDependencies(results, index, allChildren)
        return results
    }

    @TaskAction
    def serveInteractiveContent() {
        def server = null
        try {
            def latch = new CountDownLatch(1)

            server = RxNetty.createHttpServer(PORT,
                new SimpleUriRouter()
                    .addUri('/dependencies', { HttpServerRequest request, HttpServerResponse response ->
                        String conf = request.queryParameters['conf'] ?: 'compile'

                        def results = recurseDependencies([nodes: new LinkedHashSet(), links: []], 0, project.configurations[conf].resolvedConfiguration.firstLevelModuleDependencies)
                        response.writeString(new ObjectMapper().writeValueAsString(results))

                        latch.countDown()
                        response.close()
                    } as RequestHandler)
                    .addUri('/static/*', RequestHandlerWithErrorMapper.from(
                        new ClassPathFileRequestHandler('.'),
                        new FileErrorResponseMapper())
                    )
            ).start()

            Desktop.getDesktop().browse(new URI("http://localhost:$PORT/dependencies"))

            latch.await(60, TimeUnit.SECONDS)
        } finally {
            server?.shutdown()
        }
    }
}
