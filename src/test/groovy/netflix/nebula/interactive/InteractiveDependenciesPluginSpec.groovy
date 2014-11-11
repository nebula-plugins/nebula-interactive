package netflix.nebula.interactive

import nebula.test.PluginProjectSpec
import org.gradle.api.artifacts.ResolveException
import org.gradle.api.artifacts.ResolvedDependency
import org.gradle.api.plugins.GroovyPlugin
import org.gradle.api.plugins.JavaPlugin
import org.gradle.api.plugins.scala.ScalaPlugin
import spock.lang.Unroll

class InteractiveDependenciesPluginSpec extends PluginProjectSpec {
    String pluginName = 'nebula-interactive'

    def setup() {
        project.group = 'test'
        project.version = '1.0'
    }

    def 'interactive task is not available if java or groovy plugins are not also applied'() {
        when:
        project.plugins.apply(InteractiveDependenciesPlugin)
        project.tasks.interactive

        then:
        thrown(MissingPropertyException)
    }

    @Unroll
    def "interactive task is added if #pluginName is applied"() {
        when:
        project.plugins.apply(GroovyPlugin)
        project.plugins.apply(InteractiveDependenciesPlugin)

        then:
        project.tasks.interactive

        where:
        plugin << [JavaPlugin, GroovyPlugin, ScalaPlugin]
        pluginName = plugin.simpleName
    }

    def 'project is mapped to resolved dependency'() {
        when:
        project.plugins.apply(JavaPlugin)
        project.plugins.apply(InteractiveDependenciesPlugin)
        ResolvedDependency dep = project.tasks.interactive.projectAsResolvedDependency()

        then:
        dep.moduleGroup == 'test'
        dep.moduleName == 'project-is-mapped-to-resolved-dependency'
        dep.moduleVersion == '1.0'
    }

    def 'dependencies are mapped recursively'() {
        when:
        project.plugins.apply(JavaPlugin)
        project.plugins.apply(InteractiveDependenciesPlugin)

        project.repositories { mavenCentral() }
        project.dependencies { compile 'commons-beanutils:commons-beanutils:1.7.0' }

        def links = new HashSet()
        def nodes = new LinkedHashSet()

        def interactive = project.tasks.interactive
        interactive.recurseDependencies(nodes, links, interactive.projectAsResolvedDependency(), 0)

        then:
        nodes.size() == 3
        links.size() == 2
    }

    def 'single project dependencies are mapped as a set of nodes and links'() {
        when:
        project.plugins.apply(JavaPlugin)
        project.plugins.apply(InteractiveDependenciesPlugin)

        def links = new HashSet()
        def nodes = new LinkedHashSet()

        def interactive = project.tasks.interactive
        interactive.recurseDependencies(nodes, links, interactive.projectAsResolvedDependency(), 0)

        then:
        nodes.size() == 1
    }

    def 'multi-module project references are mapped as nodes and links'() {
        when:
        def a = createSubproject(project, 'a')
        def b = createSubproject(project, 'b')
        project.subprojects.addAll(a, b)

        a.plugins.apply(JavaPlugin)
        b.plugins.apply(JavaPlugin)
        b.plugins.apply(InteractiveDependenciesPlugin)

        b.dependencies { compile project.project(':a') }

        def links = new HashSet()
        def nodes = new LinkedHashSet()

        def interactive = b.tasks.interactive
        interactive.recurseDependencies(nodes, links, interactive.projectAsResolvedDependency(), 0)

        then:
        nodes.size() == 2
        nodes*.name.sort() == ['a','b']
    }

    def 'throws exception when dependencies are unresolvable'() {
        when:
        project.plugins.apply(JavaPlugin)
        project.plugins.apply(InteractiveDependenciesPlugin)

        project.repositories { mavenCentral() }
        project.dependencies { compile 'doesnot:exist:1.0' }

        def nodes = new LinkedHashSet()

        def interactive = project.tasks.interactive
        interactive.recurseDependencies(nodes, [] as Set, interactive.projectAsResolvedDependency(), 0)

        then:
        thrown(ResolveException)
    }
}
