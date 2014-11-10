package netflix.nebula.interactive

import nebula.test.IntegrationSpec
import spock.lang.Ignore

class InteractiveDependenciesPluginLauncherSpec extends IntegrationSpec {
    def setup() {
        fork = true
    }

    @Ignore
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

    def 'tooling-api-custom-model'() {
        setup:
        buildFile = new File('/Users/joschneider/Projects/github/bmuschko/tooling-api-custom-model/plugin/build.gradle')

        expect:
        buildFile.exists()
        runTasksSuccessfully('interactive')
    }
}
