package netflix.nebula.interactive

import groovy.transform.Canonical
import groovy.transform.EqualsAndHashCode
import org.gradle.api.artifacts.ResolvedDependency

@Canonical
@EqualsAndHashCode(excludes = 'index')
class Artifact {
    String org
    String name
    String version
    int index

    public Artifact(ResolvedDependency dep) {
        this.org = dep.moduleGroup
        this.name = dep.moduleName
        this.version = dep.moduleVersion
    }
}