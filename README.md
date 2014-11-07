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
apply plugin: 'nebula-interactive'
```

From the command line, run

```groovy
gradle interactive
```

![Example visualization](https://raw.githubusercontent.com/nebula-plugins/nebula-interactive/master/wiki/screenshot.png)
