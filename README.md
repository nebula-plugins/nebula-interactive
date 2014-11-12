Nebula Interactive
==================

Provides an interactive dependency visualization that provides information about:

* The transitive closure of your project
* For each dependency in the transitive closure, information about its dependencies and its dependants.

The interactive visualization is launched in a new browser window upon execution of the gradle task.

Usage
------

Apply the nebula-interactive plugin:

```groovy
buildscript {
    repositories { jcenter() }

    dependencies {
        classpath 'com.netflix.nebula:nebula-interactive:2.0.+'
    }
}

apply plugin: 'nebula-interactive'
```

Run the `interactive` task, which will launch a browser window after dependencies are resolved:

```groovy
gradle interactive
```

Example visualization
---------------------

![Example visualization](https://raw.githubusercontent.com/nebula-plugins/nebula-interactive/gradle-2.0/wiki/screenshot.png)
