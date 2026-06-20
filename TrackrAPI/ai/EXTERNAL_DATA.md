# External training data

TrackrAI uses the official **PAMAP2 Physical Activity Monitoring** dataset as an external source:

- Reiss, A. (2012), UCI Machine Learning Repository;
- DOI: https://doi.org/10.24432/C5NW2H
- source: https://archive.ics.uci.edu/dataset/231/pamap2+physical+activity+monitoring
- license: CC BY 4.0.

PAMAP2 contains heart-rate and inertial measurements collected from 9 subjects performing physical activities. The archive is not committed because it is about 656 MB.

## Reproducible preparation

From the API container:

```bash
python ai/prepare_pamap2.py
```

The script:

1. downloads the official UCI archive;
2. handles its nested `PAMAP2_Dataset.zip`;
3. reads the protocol files for the 9 subjects;
4. creates consecutive 60-second windows within the same labeled activity;
5. derives movement, steps, distance and history features;
6. stores the heart rate actually measured in the following window as `nextHrAvg`.

The generated `external_training_data.csv` currently contains 194 observed pairs. Training retains 81 locomotor pairs compatible with TrackrAI features; inactive windows without usable load are excluded.

## Supervised task

XGBoost predicts the **average heart rate of the next comparable session**, in bpm. It does not predict a hand-written score. A local pair is accepted only when both sessions last at least 5 minutes, have valid heart rate and have comparable duration and load.

Validation is separated by subject before synthetic augmentation. Augmentation is applied only to the training subset. The model is compared with a baseline that predicts that the next average heart rate will equal the current one.

Current demonstration metrics:

- 105 raw observed pairs: 24 TrackrAI and 81 PAMAP2;
- 22 validation pairs;
- MAE XGBoost: 6.172 bpm;
- RMSE: 7.907 bpm;
- R2: 0.793;
- baseline MAE: 5.434 bpm.

XGBoost does not yet beat the baseline. The application therefore displays the forecast but prevents it from authorizing an automatic increase in training load. This limitation is explicit and measurable.

When a later comparable TrackrAI session is completed, the API stores its observed heart rate and the absolute forecast error on the previous session. This creates real local feedback for future retraining.
