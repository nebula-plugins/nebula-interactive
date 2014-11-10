Nebula Interactive
==================

Provides an interactive dependency visualization that provides information about:

* The transitive closure of your project
* For each dependency in the transitive closure, information about its dependencies and its dependants.

The interactive visualization is launched in a new browser window upon execution of the gradle task.

Usage
------

First apply the nebula-interactive plugin:

```groovy
buildscript {
    repositories { jcenter() }

    dependencies {
        classpath 'com.netflix.nebula:nebula-interactive:2.0.1'
    }
}

apply plugin: 'nebula-ospackage-daemon'
```

From the command line, run

```groovy
gradle interactive
```

Example visualization
---------------------

![Example visualization](https://raw.githubusercontent.com/nebula-plugins/nebula-interactive/master/wiki/screenshot.png)
