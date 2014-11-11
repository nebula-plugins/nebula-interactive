package netflix.nebula.interactive

import nebula.test.IntegrationSpec
import spock.lang.Ignore

class InteractiveDependenciesPluginLauncherSpec extends IntegrationSpec {
    def setup() {
        fork = true
    }

//    @Ignore
    def 'opens browser'() {
        setup:
        buildFile << '''
            apply plugin: 'java'
            apply plugin: 'nebula-interactive'
            group = 'netflix'
            repositories { mavenCentral() }
            dependencies {
                compile 'com.thinkaurelius.titan:titan-core:+'
                compile 'com.thinkaurelius.titan:titan-cassandra:+'
                compile 'org.codehaus.groovy:groovy-all:2.3.3'
            }
        '''.stripIndent()

        expect:
        runTasksSuccessfully('interactive')
    }
}
