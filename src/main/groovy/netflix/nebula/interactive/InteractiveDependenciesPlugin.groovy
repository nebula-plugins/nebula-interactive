package netflix.nebula.interactive

import org.gradle.api.Plugin
import org.gradle.api.Project
import org.gradle.api.plugins.JavaPlugin

class InteractiveDependenciesPlugin implements Plugin<Project> {
    @Override
    void apply(Project project) {
        project.plugins.withType(JavaPlugin) {
            project.tasks.create(name: 'interactive', type: InteractiveDependenciesTask)
        }
    }
}
