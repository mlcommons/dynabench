# dataperf-debugging-singularity

Singularity image for running dataperf  challenge on HPC

## Install

**Step 1:** Install Singularity with [document](https://docs.sylabs.io/guides/3.5/user-guide/quick_start.html?#download-singularity-from-a-release).

**Step 2:** Install mlsphere utility and download the image.

```sh
pip install mlsphere # install mls.py utilities
mls.py pull # download the image
```

## Run

```
mls.py run create_baselines
mls.py run evaluate
mls.py run plot
```
