from .metrics_dicts import eval_metrics_dict, delta_metrics_dict

class Evaluator:
    def __init__(self, config: dict):
        self.config = config
        self.metric = config['perf_metric']['type']
        self.metric_func = eval_metrics_dict[self.metric]
        self.perturb_prefixes = [metric['type'] for metric in config['delta_metrics']]
    
    def evaluate(self, formatted_predictions: list, formatted_labels: list) -> dict:
        """ 
        Evaluates a list of predictions against a list of labels 
        using a metric included in the metrics_dictionary. 
        """
        target_ids = [x["id"] for x in formatted_labels]
        target_labels_dict = {t["id"]: t["answer"] for t in formatted_labels}
        target_labels = [target_labels_dict[id] for id in target_ids]
        target_tags_dict = {t["id"]: t["tags"] for t in formatted_labels}
        target_tags = [target_tags_dict[id] for id in target_ids]

        prediction_labels = {p["id"]: p["pred"] for p in formatted_predictions}
        prediction_labels = [prediction_labels[id] for id in target_ids]
        assert len(prediction_labels) == len(target_labels)

        perf, perf_dict = self._compute_metric(prediction_labels, target_labels)

        score_obj = {}
        score_obj["perf"] = perf
        score_obj["perf_std"] = perf_dict.get("perf_std", None)
        score_obj["pretty_perf"] = str(perf) + " %"
        score_obj["metadata_json"] = perf_dict

        return score_obj
    
    def evaluate_delta_metrics(self,
                               grouped_predictions: list,
                               grouped_robusts: list,
                               grouped_fairs: list) -> list:
        
        """
        Calculates the delta metric given a perturb prefix,
        comparing original predictions with robust and fair 
        predictions  #Strong assumption is not having to
        calculate alternative metrics from the yaml one.
        """
        delta_metrics = {}
        
        for prefix in self.perturb_prefixes:
            if prefix == 'robustness':
                delta_metric = self._compute_delta_metrics(grouped_robusts,
                                                           grouped_predictions,
                                                           prefix)
                delta_metrics['robustness'] = delta_metric.get('robustness')
            else:
                delta_metric = self._compute_delta_metrics(grouped_fairs,
                                                           grouped_predictions,
                                                           prefix)
                delta_metrics['fairness'] = delta_metric.get('fairness')
        
        return delta_metrics
        
        
    def _compute_metric(self, predictions: list, targets: list) -> tuple:
        metric_result = self.metric_func(predictions, targets)
        if isinstance(metric_result, dict):
            score_dict = metric_result
        else:
            score_dict = {self.metric: metric_result}
        return score_dict[self.metric], score_dict
    
    def _compute_delta_metrics(self, 
                               grouped_predictions: list,
                               grouped_labels: list,
                               perturb_prefix: str)-> dict:
        """
        predictions: a list of list of predictions. If computing robustness, predictions must
        be concatenated by id.  
        targets: a list of labels
        """
        perf_metric = eval_metrics_dict[self.metric]
        delta_metrics_scores = {
            perturb_prefix: delta_metrics_dict[perturb_prefix](
                grouped_predictions, grouped_labels, perf_metric
            )
        }
        return delta_metrics_scores