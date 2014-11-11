package netflix.nebula.interactive

import nebula.test.IntegrationSpec
import spock.lang.Ignore
import spock.lang.IgnoreIf

class InteractiveDependenciesPluginLauncherSpec extends IntegrationSpec {
    def setup() {
        fork = true
    }

    // we can't launch a browser from jenkins
    @IgnoreIf({ System.getenv('JENKINS_URL') })
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
