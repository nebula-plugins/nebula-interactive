package netflix.nebula.interactive

import com.fasterxml.jackson.databind.ObjectMapper
import org.gradle.api.Plugin
import org.gradle.api.Project
import org.gradle.api.artifacts.ResolvedDependency
import org.gradle.api.plugins.JavaPlugin

class InteractiveDependenciesPlugin implements Plugin<Project> {
    @Override
    void apply(Project project) {
        project.plugins.withType(JavaPlugin) {
            project.tasks.create(name: 'interactive', type: InteractiveDependenciesTask)
        }

//        def allResults = g.V.enablePath().step(Gremlin.compile(body.toString()))
//                .dedup()
//                .drop(start)
//                .iterator()
//
//        def index = 0
//        def results = allResults
//                .take(limit ?: Integer.MAX_VALUE)
//                .collectEntries { v ->
//            [(v.id): [vertex: v, asMap: v.map() + [id: v.id, label: v.label, index: index++]]]
//        }
//
//        // FIXME this will be inaccurate if the query returns edges?
//        def nodes = results.values().collect { it.asMap }
//
//        def links = []
//        results.each { id, v ->
//            links += v.vertex.outE.filter { e -> results.containsKey(e.inV.id.next()) }
//                    .collect { e -> [source: e.outV.next().id, target: e.inV.next().id, label: e.label] }
//                    .groupBy { link -> [link.source, link.target] }
//                    .inject([]) { groupedLinks, k, val ->
//                groupedLinks + [source: results.get(val[0].source).asMap.index,
//                                target: results.get(val[0].target).asMap.index,
//                                label : val*.label.join("+")]
//            }
//        }
//        return [nodes: nodes, links: links, hasNextPage: allResults.hasNext()]
    }
}
