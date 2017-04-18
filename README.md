DEPRECATED
==========

We no longer support this plugin and plan to remove it from our Github organization on May 15, 2017. If you would like to take ownership of this plugin, please file an issue declaring your interest.

Nebula Interactive
==================

This project is a placeholder for a suite of interactive tools to come.  A Gradle IDE or REPL is being considered to help plugin or task developers explore the Gradle model in real time.

For now, the interactive plugin just provides an interactive dependency visualization that provides information about:

* The transitive closure of your project
* For each dependency in the transitive closure, information about its dependencies and its dependants.

The interactive visualization is launched in a new browser window upon execution of the gradle task.

This plugin is also an early demonstration of serving a hybrid rest service/static content from RxNetty.

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
